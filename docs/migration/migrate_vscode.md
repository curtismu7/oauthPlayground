# V7 to V9 Migration Guide - VS Code Edition

**Optimized for:** VS Code + GitHub Copilot  
**Last Updated:** February 28, 2026  
**Status:** Production Guide

---

## � V9 Migration Inventory (March 2, 2026)

### ✅ Migrated to V9

| Flow | V9 File | Route | Notes |
|---|---|---|---|
| Authorization Code + PKCE | `v9/OAuthAuthorizationCodeFlowV9.tsx` | `/flows/oauth-authorization-code-v9` | V7 route redirects → V9 |
| Authorization Code Condensed | `v9/OAuthAuthorizationCodeFlowV9_Condensed.tsx` | `/flows/oauth-authorization-code-v9-condensed` | |
| Implicit Flow (OAuth + OIDC) | `v9/ImplicitFlowV9.tsx` | `/flows/implicit-v9` | V7 route redirects → V9 |
| Device Authorization (OAuth + OIDC) | `v9/DeviceAuthorizationFlowV9.tsx` | `/flows/device-authorization-v9` | V7 route redirects → V9 |
| Client Credentials | `v9/ClientCredentialsFlowV9.tsx` | `/flows/client-credentials-v9` | V7 route redirects → V9 |
| OIDC Hybrid | `v9/OIDCHybridFlowV9.tsx` | `/flows/oidc-hybrid-v9` | V7 **still also in sidebar** |
| JWT Bearer Token | `v9/JWTBearerTokenFlowV9.tsx` | `/flows/jwt-bearer-token-v9` | V7 **still also in sidebar** |
| SAML Bearer Assertion | `v9/SAMLBearerAssertionFlowV9.tsx` | `/flows/saml-bearer-assertion-v9` | V7 **still also in sidebar** |
| RAR Flow | `v9/RARFlowV9.tsx` | `/flows/rar-v9` | V7 **still also in sidebar** |
| CIBA | `pages/flows/CIBAFlowV9.tsx` | `/flows/ciba-v9` | Not in `v9/` subdir |
| Redirectless | `pages/flows/RedirectlessFlowV9_Real.tsx` | `/flows/redirectless-v7-real` (shared route) | Not in `v9/` subdir |

### ❌ Not Yet Migrated to V9 (Still V7 in Sidebar)

| Flow | Current Route | Priority | V8 Equivalent? | Notes |
|---|---|---|---|---|
| Token Exchange | `/flows/token-exchange-v7` | **CRITICAL** | Labeled "V8M" in sidebar | Complex RFC 8693 flow |
| PingOne PAR | `/flows/pingone-par-v7` | High | `PingOnePARFlowV8` in `v8/flows/` | PAR + PKCE |
| PingOne MFA | `/flows/pingone-complete-mfa-v7` | High | `CompleteMFAFlowV8.tsx` in `v8/flows/` | Complex MFA lifecycle |
| PingOne MFA Workflow Library | `/flows/pingone-mfa-workflow-library-v7` | High | `MFAFlowV8.tsx` in `v8/flows/` | |
| Worker Token | `/flows/worker-token-v7` | High | `WorkerTokenFlowV7` | Token acquisition flow |
| ROPC | `/flows/oauth-ropc-v7` | Medium | — | Deprecated by OAuth 2.1 |
| Auth Code Condensed (Mock) | `/flows/oauth-authorization-code-v7-condensed-mock` | Low | — | Educational mock |
| V7 Condensed Prototype | `/flows/v7-condensed-mock` | Low | — | Prototype only |

### ⚠️ V8 Flows in Sidebar (Not V9)

These are V8-native flows with no V9 equivalent yet:

| Flow | Route | File |
|---|---|---|
| Authorization Code V8 | `/flows/oauth-authorization-code-v8` | `v8/flows/OAuthAuthorizationCodeFlowV8.tsx` |
| Implicit Flow V8 | `/flows/implicit-v8` | `v8/flows/ImplicitFlowV8.tsx` |
| DPoP Authorization Code V8 | `/flows/dpop-authorization-code-v8` | — |

### 🧹 Cleanup Done (March 2, 2026)

Removed duplicate V7 sidebar entries from `sidebarMenuConfig.ts` — V9 is now the only entry for these flows:

- ~~`/flows/oidc-hybrid-v7`~~ → `/flows/oidc-hybrid-v9` ✅
- ~~`/flows/jwt-bearer-token-v7`~~ → `/flows/jwt-bearer-token-v9` ✅
- ~~`/flows/saml-bearer-assertion-v7`~~ → `/flows/saml-bearer-assertion-v9` ✅
- ~~`/flows/rar-v7`~~ → `/flows/rar-v9` ✅

### 📌 Remaining Migration TODOs

**High Priority — V8 source exists, ready to migrate:**
- [ ] Token Exchange V7 (`/flows/token-exchange-v7`, labeled "V8M") → V9 (source: `v8/flows/TokenExchangeFlowV8.tsx`)
- [ ] PingOne PAR V7 → V9 (source: `v8/flows/PingOnePARFlowV8/`)
- [ ] PingOne MFA V7 → V9 (source: `v8/flows/CompleteMFAFlowV8.tsx`)
- [ ] PingOne MFA Workflow Library V7 → V9 (source: `v8/flows/MFAFlowV8.tsx`)
- [ ] Worker Token V7 → V9

**Medium Priority:**
- [ ] ROPC V7 → V9 (note: deprecated by OAuth 2.1 — consider educational-only status)

**Low Priority / Prototype:**
- [ ] Auth Code Condensed (Mock) V7 — evaluate if V9 condensed already covers this
- [ ] V7 Condensed Prototype — evaluate for removal

**V8 flows without V9 equivalent:**
- [ ] Authorization Code V8 (`/flows/oauth-authorization-code-v8`) → V9
- [ ] Implicit Flow V8 (`/flows/implicit-v8`) → V9
- [ ] DPoP Authorization Code V8 (`/flows/dpop-authorization-code-v8`) → V9

**V9 services still needed (per Priority 1 plan):**
- [ ] `mfaServiceV8` → V9MFAService (High complexity)
- [ ] `workerTokenServiceV8` → V9TokenService
- [ ] `credentialsServiceV8` → V9CredentialService (High complexity)
- [ ] `unifiedFlowLoggerServiceV8` → V9LoggingService

### V9 Services Created

| Service | File |
|---|---|
| Credential validation | `services/v9/v9CredentialValidationService.tsx` |
| Worker token status | `services/v9/V9WorkerTokenStatusService.ts` |
| Spec version | `services/v9/V9SpecVersionService.ts` |
| Token service | `services/v9/V9TokenService.ts` |
| Authorize service | `services/v9/V9AuthorizeService.ts` |
| Device authorization | `services/v9/V9DeviceAuthorizationService.ts` |
| Introspection | `services/v9/V9IntrospectionService.ts` |
| User info | `services/v9/V9UserInfoService.ts` |
| PKCE generation | `services/v9/core/V9PKCEGenerationService.ts` |
| OAuth error handling | `services/v9/core/V9OAuthErrorHandlingService.ts` |
| Flow credential service | `services/v9/core/V9FlowCredentialService.ts` |
| Credentials service | `services/v9/credentialsServiceV9.ts` |
| Environment ID | `services/v9/environmentIdServiceV9.ts` |
| Postman generator | `services/v9/postmanCollectionGeneratorV9.ts` |
| V8→V9 adapter | `services/v9/V8ToV9WorkerTokenStatusAdapter.ts` |

---

## �📖 CRITICAL: Read Before Starting

**Before migrating any flow, read:**
- [V9 Migration Lessons Learned](./V9_MIGRATION_LESSONS_LEARNED.md) - All errors discovered and solutions
- [V7 to V9 Migration Guide](./V7_TO_V9_MIGRATION_GUIDE.md) - Original migration plan
- [V7 to V8/V9 Upgrade Targets](./V7_TO_V8_UPGRADE_TARGETS.md) - Priority list of 18 V7 apps still in sidebar + service dependency analysis

> **Note:** There is no separate V8→V9 migration doc. V8 flows live in `src/v8/flows/` and are migrated to V9 using this guide — the [V8 Architecture Reference](#️-v8-architecture-reference) section below covers V8-specific import patterns.

This guide combines the migration workflow with lessons learned from the first production V7→V9 migration to help you avoid common pitfalls.

---

## 🎯 Migration Overview

### What You're Migrating
- **From:** V7 OAuth/OIDC flows in `src/pages/flows/`
- **From:** V8 feature module in `src/v8/`
- **To:** V9 flows in `src/pages/flows/v9/` subdirectory

### Why V9?
- ✅ Modern credential validation
- ✅ Better error handling
- ✅ Improved state management
- ✅ Version-specific services (no V7/V8 dependencies)

### Success Metrics (First Session)
- **Time:** 2 days (vs 6-week estimate = **21x faster**)
- **Files Created:** 8 (4 flows + 2 services + 2 tests)
- **Import Errors Fixed:** 7 distinct types
- **Final Status:** All flows compile and run successfully ✅

---

## 🏗️ V8 Architecture Reference

V8 is a **self-contained feature module** at `src/v8/`. Unlike V7 which scattered files across `src/pages/flows/`, `src/services/`, etc., V8 uses a monorepo-style layout:

```
src/v8/
├── components/          # ~80 UI components (WorkerTokenSectionV8, MFA*, etc.)
├── services/            # ~60 services (all OAuth/MFA/worker token logic)
│   ├── auth/            # tokenGatewayV8.ts
│   └── __tests__/       # service unit tests
├── flows/               # ~20 full flow pages (V8 OAuth/MFA flows)
│   ├── shared/          # shared flow utilities
│   ├── components/      # flow-local components
│   ├── controllers/     # flow controllers
│   ├── hooks/           # flow-scoped hooks
│   └── unified/         # unified MFA flow helpers
├── pages/               # ~15 standalone utility pages
├── hooks/               # ~20 shared hooks (useWorkerToken, useMFADevices, etc.)
├── utils/               # ~20 utils (toastNotificationsV8, analytics, etc.)
├── styles/              # designTokens.ts, styleUtils.ts, STYLE_GUIDE.md
├── constants/           # pingIdentityColors.ts, uiStandardsV8.ts
├── types/               # shared TypeScript interfaces
└── design/              # tokens.ts
```

### V8 Flows Catalog

| Flow File | Route / Purpose |
|---|---|
| `ImplicitFlowV8.tsx` | OAuth 2.0 Implicit |
| `OAuthAuthorizationCodeFlowV8.tsx` | Auth Code + PKCE |
| `OIDCHybridFlowV8.tsx` | OIDC Hybrid |
| `CIBAFlowV8.tsx` | CIBA (backchannel auth) |
| `TokenExchangeFlowV8.tsx` | Token Exchange RFC 8693 |
| `ResourcesAPIFlowV8.tsx` | Resource Indicators |
| `PingOnePARFlowV8/` | Pushed Authorization Requests |
| `PingOneProtectFlowV8.tsx` | PingOne Protect |
| `MFAFlowV8.tsx` | MFA base flow |
| `MFAAuthenticationMainPageV8.tsx` | MFA authentication |
| `MFAConfigurationPageV8.tsx` | MFA setup/config |
| `MFADeviceManagementFlowV8.tsx` | Device management |
| `MFADeviceOrderingFlowV8.tsx` | Device ordering |
| `EmailMFASignOnFlowV8.tsx` | Email MFA sign-on |
| `CompleteMFAFlowV8.tsx` | Full MFA lifecycle |
| `NewMFAFlowV8.tsx` | New MFA enrollment |
| `MFASettingsV8.tsx` | MFA settings page |
| `MFAReportingFlowV8.tsx` | MFA reporting |

### Key V8 Services

| Service | Purpose | Import Count |
|---|---|---|
| `workerTokenStatusServiceV8` | Worker token status/display | ~107 |
| `specVersionServiceV8` | OAuth spec version detection | ~86 |
| `mfaServiceV8` | MFA orchestration | ~75 |
| `workerTokenServiceV8` | Worker token lifecycle | ~70 |
| `credentialsServiceV8` | Credential management | ~70 |
| `oauthIntegrationServiceV8` | OAuth flow integration | — |
| `environmentIdServiceV8` | Environment ID resolution | — |
| `validationServiceV8` | Input validation | — |
| `storageServiceV8` | Dual storage (IndexedDB+SQLite) | — |
| `uiNotificationServiceV8` | Notification management | — |

### Key V8 Components Commonly Used Outside V8

```typescript
// Worker token display + controls (most common)
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

// Worker token modal (get/set token)
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';

// Token expiry warning banner
import { WorkerTokenExpiryBannerV8 } from '@/v8/components/WorkerTokenExpiryBannerV8';

// Worker token status badge
import { WorkerTokenStatusDisplayV8 } from '@/v8/components/WorkerTokenStatusDisplayV8';

// API call display (shows request/response)
import { SuperSimpleApiDisplayV8 } from '../v8/components/SuperSimpleApiDisplayV8';

// User search dropdown (auto-populates from PingOne)
import { UserSearchDropdownV8 } from '../../v8/components/UserSearchDropdownV8';

// Silent API config checkbox
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';

// Toast notifications (V8 style)
import { toastV8 } from '../../../v8/utils/toastNotificationsV8';
```

### V8 Import Path Conventions

The correct import path **depends on where the consuming file lives**:

| Consuming file location | Import V8 component as |
|---|---|
| `src/pages/SomePage.tsx` | `'../v8/components/...'` or `'@/v8/components/...'` |
| `src/pages/flows/SomeFlow.tsx` | `'../../v8/components/...'` or `'@/v8/...'` |
| `src/pages/flows/v9/SomeFlowV9.tsx` | `'../../../v8/components/...'` or `'@/v8/...'` |
| `src/v8/flows/SomeFlowV8.tsx` | `'../components/...'` (within V8) |
| `src/v8/services/someService.ts` | `'../utils/...'` (within V8) |

**Prefer the `@/v8/...` alias** when available — it works everywhere and never needs depth adjustment:
```typescript
// ✅ Alias — path-depth independent
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';

// ⚠️ Relative — must match exact depth
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';
```

### V8 → V9 Migration: Import Depth Differences

When migrating a **V8 flow** (lives in `src/v8/flows/`) to V9 (lives in `src/pages/flows/v9/`), the import depths change significantly:

```bash
# Within V8 flow (src/v8/flows/MyFlowV8.tsx)
from '../services/workerTokenServiceV8'   # 1 level up
from '../components/WorkerTokenSectionV8' # 1 level up
from '../hooks/useWorkerToken'            # 1 level up

# Same imports in V9 (src/pages/flows/v9/MyFlowV9.tsx)
from '../../../v8/services/workerTokenServiceV8'   # 3 levels + v8/
from '../../../v8/components/WorkerTokenSectionV8' # 3 levels + v8/
# OR use the alias (preferred):
from '@/v8/services/workerTokenServiceV8'
from '@/v8/components/WorkerTokenSectionV8'
```

**Bulk fix V8 internal imports when putting into V9:**
```bash
FLOW="src/pages/flows/v9/MyFlowV9.tsx"

# V8 internal imports → either alias or full relative path
sed -i '' "s|from '../services/|from '@/v8/services/|g" "$FLOW"
sed -i '' "s|from '../components/|from '@/v8/components/|g" "$FLOW"
sed -i '' "s|from '../hooks/|from '@/v8/hooks/|g" "$FLOW"
sed -i '' "s|from '../utils/|from '@/v8/utils/|g" "$FLOW"
```

---

## 🎨 UI COLOR STANDARDS (MANDATORY)

**Approved Colors Only:** Red, Blue, Black, White

**Primary Blue (Headers, Primary Actions):**
- `#2563eb` - Primary blue (borders, accents)
- `#1e40af` - Darker blue (headings)
- `#1e3a8a` - Darkest blue (text)
- `#eff6ff` - Light blue background
- `#dbeafe` - Lighter blue background

**Red (Errors, Warnings, Destructive Actions):**
- `#dc2626` - Error red
- `#fef2f2` - Light red background

**Neutral (Backgrounds, Borders):**
- `#111827` - Black (primary text)
- `#1f2937` - Dark gray (code blocks)
- `#6b7280` - Medium gray (secondary text)
- `#f9fafb` - Light gray (page background)
- `#e5e7eb` - Border gray
- `white` / `#ffffff` - White

**Header Gradient — Blue (default) or Red (PingOne admin pages):**
```typescript
// Standard blue header (flows, utilities, general pages)
background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
// NOT purple: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) ❌

// Red header (PingOne Management API pages — Webhook Viewer, Audit, etc.)
background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
// Title and subtitle must use color: white / rgba(255,255,255,0.85) ❌ not #0891b2
```

**❌ FORBIDDEN COLORS:**
- Purple (#8b5cf6, #7c3aed, #6d28d9, etc.)
- Green (except success states: #10b981)
- Orange (except warnings: #f59e0b)
- Any color not listed above

**Reference Pages:**
- ✅ [CustomDomainTestPage.tsx](../../src/pages/CustomDomainTestPage.tsx) - Approved blue/red palette
- ✅ [Dashboard.tsx](../../src/pages/Dashboard.tsx) - Standard blue headers
- ✅ [PingOneAuditActivities.tsx](../../src/pages/PingOneAuditActivities.tsx) - Red header (PingOne Management API page)
- ✅ [PingOneWebhookViewer.tsx](../../src/pages/PingOneWebhookViewer.tsx) - Red header + popout pattern

---

## � Toast Replacement (MANDATORY)

All toast-based notifications must be replaced with context-aware feedback patterns. **Do not use toasts unless explicitly justified.**

### Core Principles

1. **Anchor feedback to context.** Notifications must appear near the UI element or workflow that triggered them.
2. **Ephemeral feedback is only acceptable for non-critical, non-blocking events.**
3. **Errors must be actionable and specific.** Users should never have to guess what failed or what to do next.
4. **Critical system state changes must persist.**
5. **Avoid modal interruptions unless absolutely necessary.**

### Replacement Decision Framework

Classify the original toast intent, then apply the matching pattern:

#### ✅ Success Confirmation
Replace toast with one of:
- Inline confirmation message near the triggering element
- Button state transition: `Save` → `Saved ✓`
- Contextual success banner within the active view

#### ❌ Validation Error
Replace with:
- Field-level validation messages + error borders/icons
- Scroll-to-first-error behavior
- Optional form-level error summary banner

**Never use global notifications for validation errors.**

#### ⚠️ System Warning / Account State / Permissions
Replace with:
- Persistent top-of-page alert banner (info / warning / critical severity)
- Optional CTA button + dismiss control
- Banner must remain until resolved or dismissed

#### ↩️ Reversible Action (Undo Pattern)
Replace with:
- Snackbar — persistent, anchored, 6–10 second duration
- Prominent "Undo" action with accessible focus handling
- **Do not auto-dismiss in under 5 seconds**

#### 📋 Multi-Step or Complex State Changes
Replace with:
- Inline expandable section
- Side panel / drawer
- Contextual detail view

### Accessibility Requirements

All replacements must:
- Support screen readers (ARIA live regions where needed)
- Meet contrast requirements
- Not rely solely on color for meaning
- Preserve keyboard navigation

### Implementation Constraints

- Do not introduce new notification systems unless necessary — prefer extending existing components.
- Avoid breaking API contracts.
- If a change affects shared services or other modules, flag it before implementation.

### Output Requirements (When Replacing a Toast)

1. Identify the original use case.
2. Justify the selected replacement pattern.
3. Specify: component used, placement, dismiss behavior, duration (if applicable).
4. Note any side effects on existing flows.

### ❌ Explicit Prohibition

- Do NOT replace toast with another transient overlay by default.
- Do NOT hide errors in global notification layers.
- Do NOT introduce silent failures.
- Do NOT make critical alerts auto-dismiss.

---

## �🚨 Common Errors You WILL Encounter

### Error 1: Wrong Import Path Depth
**Symptom:**
```
Failed to resolve import "../../services/pingOneAppCreationService"
```

**Why:** V9 subdirectory requires `../../../` (3 levels), not `../../` (2 levels)

**Fix:**
```bash
# Bulk fix all imports in one command
sed -i '' 's|from "../../services/|from "../../../services/|g' src/pages/flows/v9/YourFlowV9.tsx
sed -i '' 's|from "../../utils/|from "../../../utils/|g' src/pages/flows/v9/YourFlowV9.tsx
sed -i '' 's|from "../../hooks/|from "../../../hooks/|g' src/pages/flows/v9/YourFlowV9.tsx
```

### Error 2: Config File Path Wrong
**Symptom:**
```
Failed to resolve import "./config/OAuthAuthzCodeFlowV9.config"
```

**Why:** Config is sibling directory, not child of v9/

**Fix:**
```typescript
// WRONG
import { config } from './config/flow.config';

// CORRECT
import { config } from '../config/flow.config';
```

### Error 3: Missing V9 Helper Class
**Symptom:**
```
'ImplicitFlowV9Helpers' does not exist
```

**Why:** You need to create V9 version of helper classes

**Fix:** See "Creating V9 Service Classes" section below

### Error 4: Wrong Utility Filename
**Symptom:**
```
Failed to resolve import "../utils/v4ToastManager"
```

**Why:** File is actually `v4ToastMessages.ts` not `v4ToastManager.ts`

**Fix:**
```bash
# Find all incorrect imports
grep -rl "from.*v4ToastManager" src/ --include="*.ts" --include="*.tsx"

# Fix them all at once
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|utils/v4ToastManager|utils/v4ToastMessages|g'
```

### Error 5: Archived Files Missing
**Symptom:**
```
Cannot find module '../utils/v4ToastMessages'
```

**Why:** File was archived and not in active src/

**Fix:**
```bash
# Search archives
find archived -name "v4ToastMessages.ts"

# Restore
cp archived/v4/utils/v4ToastMessages.ts src/utils/
```

### Error 6: Using localStorage for Worker Tokens
**Symptom:**
```typescript
const stored = localStorage.getItem('unified_worker_token');
const data = JSON.parse(stored);
```

**Why:** Pages should use `unifiedWorkerTokenService` for consistent worker token management, dual storage (IndexedDB + SQLite), and event-driven updates.

### Error 7: V8 Internal Import Used Outside V8
**Symptom:**
```
Failed to resolve import "../services/workerTokenServiceV8"
```

**Why:** File was copied from `src/v8/flows/` without updating the single-level V8-internal imports. From `src/pages/flows/v9/`, V8 modules are 3+ levels away.

**Fix:**
```bash
FLOW="src/pages/flows/v9/MyFlowV9.tsx"

# Replace V8-internal single-slash imports with alias
sed -i '' "s|from '../services/|from '@/v8/services/|g" "$FLOW"
sed -i '' "s|from '../components/|from '@/v8/components/|g" "$FLOW"
sed -i '' "s|from '../hooks/|from '@/v8/hooks/|g" "$FLOW"
sed -i '' "s|from '../utils/|from '@/v8/utils/|g" "$FLOW"
```

### Error 8: Wrong V8 Component Reference (WorkerTokenSectionV8)
**Symptom:**
```
Module '"../v8/components/WorkerTokenSectionV8"' has no exported member...
```

**Why:** `WorkerTokenSectionV8` has a named export. Confirm from `src/v8/components/WorkerTokenSectionV8.tsx`.

**Fix:**
```typescript
// ✅ Correct named import
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';
// ✅ OR via alias
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';
```

**Fix:**
```bash
# Check if page uses localStorage for worker tokens
grep -n "localStorage.getItem('unified_worker_token')" src/pages/YourPage.tsx
grep -n "localStorage.removeItem('unified_worker_token')" src/pages/YourPage.tsx

# If found, migrate to unified service:
# 1. Add import
echo "import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';" >> src/pages/YourPage.tsx

# 2. Replace localStorage.getItem
sed -i '' "s/const stored = localStorage.getItem('unified_worker_token');/const data = unifiedWorkerTokenService.getTokenDataSync();/" src/pages/YourPage.tsx
sed -i '' "s/if (stored) {/if (data) {/" src/pages/YourPage.tsx
sed -i '' "/const data = JSON.parse(stored);/d" src/pages/YourPage.tsx

# 3. Replace localStorage.removeItem
sed -i '' "s/localStorage.removeItem('unified_worker_token');/unifiedWorkerTokenService.clearToken();/" src/pages/YourPage.tsx
```

**Examples:**
- ✅ [PingOne User Profile](../updates-to-apps/pingone-user-profile-updates.md) - Migrated 2026-02-27
- ✅ [Configuration](../updates-to-apps/configuration-dashboard-v8-migration.md) - Migrated 2026-02-27
- ✅ [Dashboard](../updates-to-apps/configuration-dashboard-v8-migration.md) - Migrated 2026-02-27
- ✅ [PingOneAuditActivities.tsx](../../src/pages/PingOneAuditActivities.tsx) - Migrated 2026-02-28

---

## 📋 Pre-Migration Checklist

### Identify Source Version

Before running any checks, confirm whether you are migrating a **V7 flow** or a **V8 flow**:

| Source | File Location | Import depth to V9 |
|---|---|---|
| **V7 flow** | `src/pages/flows/v7/` | `../../` → `../../../` |
| **V8 flow** | `src/v8/flows/` | `../` (V8-internal) → `@/v8/...` (alias) |
| **V8 page** | `src/v8/pages/` | `../` (V8-internal) → `@/v8/...` (alias) |

**Run BEFORE starting each flow migration:**

```bash
#!/bin/bash
# Save as: scripts/pre-migration-check.sh

FLOW_NAME="YourFlowV7"
V7_FILE="src/pages/flows/v7/${FLOW_NAME}.tsx"

echo "🔍 Pre-Migration Check for ${FLOW_NAME}"
echo "========================================="

# 1. Check for V7-specific services
echo "1. V7-specific services that need migration:"
grep -o "V7[A-Za-z]*Service" "$V7_FILE" | sort -u || echo "   ✓ None found"

# 2. Check for V7-specific helpers
echo "2. V7-specific helpers that need migration:"
grep -o "V7[A-Za-z]*Helper" "$V7_FILE" | sort -u || echo "   ✓ None found"

# 3. Check utilities exist
echo "3. Checking utility files:"
grep "from.*utils/" "$V7_FILE" | sed "s/.*utils\/\([^'\"]*\).*/\1/" | sort -u | while read util; do
  if [ ! -f "src/utils/${util}.ts" ] && [ ! -f "src/utils/${util}.tsx" ]; then
    echo "   ⚠️  Missing: $util"
    ARCHIVED=$(find archived -name "${util}.*" 2>/dev/null | head -1)
    [ -n "$ARCHIVED" ] && echo "      Found in: $ARCHIVED"
  else
    echo "   ✓ $util"
  fi
done

# 4. Check for direct localStorage worker token usage
echo "4. Worker token storage check:"
if grep -q "localStorage.getItem('unified_worker_token')\|localStorage.removeItem('unified_worker_token')" "$V7_FILE" 2>/dev/null; then
  echo "   ⚠️  Using direct localStorage for worker tokens"
  echo "      Should migrate to: unifiedWorkerTokenService"
  echo "      See Error 6 in migration guide"
else
  echo "   ✓ Using unified worker token service (or no worker tokens)"
fi

# 5. Check external dependencies
echo "5. External URLs (needs vendoring):"
grep -o "https://[^'\"]*" "$V7_FILE" | sort -u || echo "   ✓ None found"

echo ""
echo "✅ Pre-flight check complete!"
```

**Usage:**
```bash
chmod +x scripts/pre-migration-check.sh
FLOW_NAME="ImplicitFlowV7" ./scripts/pre-migration-check.sh
```

---

## 🛠️ Step-by-Step Migration Workflow

> **Migrating a V8 flow?** V8 flows live in `src/v8/flows/` and use V8-internal single-level imports. When placing them into `src/pages/flows/v9/`, use the `@/v8/...` alias instead of rewriting relative paths. See [V8 Architecture Reference](#-v8-architecture-reference) and [Error 7](#error-7-v8-internal-import-used-outside-v8) for details.

### Step 1: Create V9 Service Classes (If Needed)

**Check if V7 services need V9 versions:**
```bash
grep -o "V7[A-Za-z]*Service" src/pages/flows/v7/YourFlowV7.tsx | sort -u
```

**Check if V8 services need V9 wrapping:**
```bash
grep -o "[A-Za-z]*ServiceV8" src/v8/flows/YourFlowV8.tsx | sort -u
# Most V8 services can be imported directly via @/v8/services/ — no copy needed
```

**If you see `v7CredentialValidationService`:**

```bash
# 1. Copy V7 to V9
cp src/services/v7CredentialValidationService.tsx src/services/v9/v9CredentialValidationService.tsx

# 2. Fix import paths (../../ → ../../../)
sed -i '' 's|from "../../|from "../../../|g' src/services/v9/v9CredentialValidationService.tsx

# 3. Rename class and exports
sed -i '' 's/V7CredentialValidation/V9CredentialValidation/g' src/services/v9/v9CredentialValidationService.tsx

# 4. Verify
grep "export class" src/services/v9/v9CredentialValidationService.tsx
```

**If you see `ImplicitFlowV7Helpers`:**

1. Open `src/services/implicitFlowSharedService.ts`
2. Find `ImplicitFlowV7Helpers` class
3. Copy entire class and rename to `ImplicitFlowV9Helpers`
4. Update version metadata:
   - `version: 'v7'` → `version: 'v9'`
   - Flow names: Add "(V9)" suffix
5. Export in service object:
   ```typescript
   export const ImplicitFlowSharedService = {
     // ... existing
     V9Helpers: ImplicitFlowV9Helpers,  // Add this
   };
   ```

### Step 2: Create V9 Flow File

```bash
# Copy V7 to v9 subdirectory
cp src/pages/flows/v7/ImplicitFlowV7.tsx src/pages/flows/v9/ImplicitFlowV9.tsx
```

### Step 3: Fix ALL Import Paths

**CRITICAL:** V9 subdirectory uses `../../../` not `../../`

```bash
FLOW="src/pages/flows/v9/ImplicitFlowV9.tsx"

# Fix service imports
sed -i '' 's|from "../../services/|from "../../../services/|g' "$FLOW"

# Fix util imports
sed -i '' 's|from "../../utils/|from "../../../utils/|g' "$FLOW"

# Fix hook imports
sed -i '' 's|from "../../hooks/|from "../../../hooks/|g' "$FLOW"

# Fix component imports
sed -i '' 's|from "../../components/|from "../../../components/|g' "$FLOW"

# Fix config paths (sibling directory)
sed -i '' 's|from "./config/|from "../config/|g' "$FLOW"

# Fix dynamic imports
sed -i '' "s|'../../services/|'../../../services/|g" "$FLOW"
sed -i '' "s|'../../utils/|'../../../utils/|g" "$FLOW"
```

### Step 4: Update Service References

```bash
FLOW="src/pages/flows/v9/ImplicitFlowV9.tsx"

# Update service names V7 → V9
sed -i '' 's/V7CredentialValidation/V9CredentialValidation/g' "$FLOW"
sed -i '' 's/ImplicitFlowV7Helpers/ImplicitFlowV9Helpers/g' "$FLOW"

# Update component name
sed -i '' 's/ImplicitFlowV7/ImplicitFlowV9/g' "$FLOW"
```

### Step 5: Verify No Errors

```bash
# TypeScript check
npx tsc --noEmit "$FLOW"

# If errors, check specific imports
grep "from ['\"]" "$FLOW" | head -20
```

### Step 6: Create Route and Menu Entry

**Add to `src/App.tsx`:**
```typescript
import ImplicitFlowV9 from './pages/flows/v9/ImplicitFlowV9';

// In routes:
<Route path="/flows/implicit-v9" element={<ImplicitFlowV9 />} />
<Route path="/flows/implicit-v9?variant=oidc" element={<ImplicitFlowV9 />} />
```

**Add to `src/config/sidebarMenuConfig.ts`:**
```typescript
['/flows/implicit-v9', 'OAuth 2.0 Implicit Flow (V9)'],
['/flows/implicit-v9?variant=oidc', 'OIDC Implicit Flow (V9)'],
```

### Step 7: Test

---

## 🪟 Popout Window Pattern (Monitoring Pages)

Pages used to **monitor live events** (webhook viewer, debug log viewer) must support a popout window so the user can watch them while running a flow in the main tab.

### 1. Create the helper utility

```typescript
// src/v8/utils/myPagePopoutHelper.ts
const POPUP_WIDTH = 1400;
const POPUP_HEIGHT = 900;

export function openMyPagePopout(): void {
  const left = (window.screen.width - POPUP_WIDTH) / 2;
  const top = (window.screen.height - POPUP_HEIGHT) / 2;
  const popup = window.open(
    '/my-page-popout',
    'myPagePopout',
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`
  );
  if (!popup) { alert('Popup blocked. Please allow popups for this site.'); return; }
  popup.focus();
}

export function isMyPagePopout(): boolean {
  return window.location.pathname.includes('/my-page-popout');
}
```

### 2. Register route in App.tsx

```tsx
// Add import
import { isMyPagePopout } from './v8/utils/myPagePopoutHelper';

// In the App component routing block — add BEFORE the main app branch:
} : isMyPagePopout() ? (
  <Routes>
    <Route path="/my-page-popout" element={<MyPage />} />
    <Route path="*" element={<Navigate to="/my-page-popout" replace />} />
  </Routes>
) : (
  // ...main app

// Also add inside main app Routes (so deep-linking still works):
<Route path="/my-page-popout" element={<MyPage />} />
```

### 3. Add Popout button in the header

Place the button inside `TitleRow` — hide it when already in popout via `!isMyPagePopout()`:

```tsx
import { FiExternalLink } from 'react-icons/fi';
import { isMyPagePopout, openMyPagePopout } from '../v8/utils/myPagePopoutHelper';

// In JSX header:
{!isMyPagePopout() && (
  <button
    type="button"
    onClick={openMyPagePopout}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      paddingInline: '0.85rem', paddingBlock: '0.45rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(255,255,255,0.4)',
      background: 'rgba(255,255,255,0.15)',
      color: 'white', fontSize: '0.8rem', fontWeight: 600,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}
    title="Open in popout window to monitor while using the app"
  >
    <FiExternalLink size={14} />
    Popout
  </button>
)}
```

**Reference implementation:** `src/pages/PingOneWebhookViewer.tsx` + `src/v8/utils/webhookViewerPopoutHelper.ts`

---

```bash
npm run dev
```

Visit the new route and verify:
- ✅ Page loads without errors
- ✅ No import errors in console
- ✅ Flow executes successfully
- ✅ All UI elements render

---

## 🔍 Post-Migration Validation

### Import Resolution Check

```bash
# Check all imports resolve
npx tsc --noEmit src/pages/flows/v9/YourFlowV9.tsx
```

### Diff Review

```bash
# Compare V7 vs V9 - should only show import path changes
diff -u src/pages/flows/v7/YourFlowV7.tsx src/pages/flows/v9/YourFlowV9.tsx | less
```

**Expected Differences:**
- ✅ Import paths: `../../` → `../../../`
- ✅ Service names: `V7` → `V9`
- ✅ Component name: `FlowV7` → `FlowV9`
- ❌ **No business logic changes**

### Runtime Testing Checklist

- [ ] Flow page loads without errors
- [ ] Credentials can be entered
- [ ] Authorization flow completes
- [ ] Tokens display correctly
- [ ] No console errors
- [ ] v9CredentialValidationService works
- [ ] Helper methods work correctly

---

## 📚 Reference: Files Modified in First Session

### V8 Module Structure (Key Files)

**Components (import via `@/v8/components/...`):**
- `WorkerTokenSectionV8` — token status + Get/Update/Clear UI, most pages use this
- `WorkerTokenModalV8` — modal to acquire/update worker token
- `WorkerTokenExpiryBannerV8` — expiry warning banner
- `WorkerTokenStatusDisplayV8` — compact token status badge
- `SuperSimpleApiDisplayV8` — request/response display for API calls
- `UserSearchDropdownV8` — PingOne user search/auto-populate
- `SilentApiConfigCheckboxV8` / `ShowTokenConfigCheckboxV8` — flow config controls

**Services (import via `@/v8/services/...`):**
- `workerTokenServiceV8` — token acquire/refresh/clear lifecycle
- `workerTokenStatusServiceV8` — token status polling + events
- `credentialsServiceV8` / `enhancedCredentialsServiceV8` — credential storage
- `specVersionServiceV8` — OAuth spec version detection
- `mfaServiceV8` — MFA orchestration
- `validationServiceV8` — input/credential validation
- `storageServiceV8` — dual storage (IndexedDB + SQLite)
- `oauthIntegrationServiceV8` — OAuth flow coordination
- `environmentIdServiceV8` — environment ID resolution

**Hooks (import via `@/v8/hooks/...`):**
- `useWorkerToken` — subscribe to worker token state
- `useMFADevices` — MFA device list management
- `useMFAAuthentication` — MFA auth state machine
- `useStepNavigationV8` — flow step navigation
- `useCibaFlowV8` / `useHybridFlowV8` — flow-specific hooks

**Utils (import via `@/v8/utils/...`):**
- `toastNotificationsV8` — V8-style toasts (use sparingly per toast replacement guide)
- `analyticsLoggerV8` — analytics/event logging
- `webhookViewerPopoutHelper` — popout window utilities
- `unifiedErrorHandlerV8` — centralized error handling

### Services Created (V9 Session)
1. `src/services/v9/v9CredentialValidationService.tsx` (474 lines)
2. `src/services/implicitFlowSharedService.ts` - Added `ImplicitFlowV9Helpers` class

### Flows Migrated (4 CRITICAL flows)
1. `src/pages/flows/v9/ImplicitFlowV9.tsx` (2,084 lines)
2. `src/pages/flows/v9/ClientCredentialsFlowV9.tsx` (1,156 lines)
3. `src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx` (127KB)
4. `src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx` (4,430 lines)

### Import Fixes Applied (12 files)
**v4ToastManager → v4ToastMessages:**
- WorkerTokenTester.tsx
- CredentialBackupManager.tsx
- FIDO2RegistrationModal.tsx
- InteractiveCodeEditor.tsx
- SAMLAssertionDisplay.tsx
- TOTPQRCodeModal.tsx
- MFADeviceManager.tsx
- CIBAFlowV9.tsx
- KrogerGroceryStoreMFA_New.tsx
- RedirectlessFlowV9_Real.tsx
- redirectlessAuthService.ts
- credentialsWarningService.ts

### External Assets Localized
- `src/styles/vendor/end-user-nano.css` (682KB) - Previously external URL (403 error)

---

## 🎯 Migration Template

Copy this for each new flow:

```markdown
## Migration: [FlowName] V7 → V9

### Pre-Migration
- [ ] Run pre-migration check script
- [ ] Identify V7-specific services needed
- [ ] Create V9 service classes
- [ ] Verify all utilities exist
- [ ] Check external dependencies

### Migration
- [ ] Copy V7 file to v9/ subdirectory
- [ ] Fix all import paths (../../ → ../../../)
- [ ] Fix config paths (./config/ → ../config/)
- [ ] Update service names (V7 → V9)
- [ ] Update component/class names
- [ ] Fix dynamic imports

### Validation
- [ ] TypeScript compiles without errors
- [ ] No import errors in Vite
- [ ] Runtime testing passes
- [ ] No console errors
- [ ] Diff review shows only expected changes

### Integration
- [ ] Add route to App.tsx
- [ ] Add menu entries to sidebarMenuConfig.ts
- [ ] Update migration guide
- [ ] Test in production build

### Documentation
- [ ] Update V7_TO_V9_MIGRATION_GUIDE.md
- [ ] Document any new issues found
- [ ] Update completion status
```

---

## 🆘 Troubleshooting Guide

### "Cannot find module" Errors

**Step 1:** Check path depth
```bash
# Count directories from v9/ to src/
# v9/ → flows/ → pages/ → src/ = 3 levels
# Therefore use: ../../../
```

**Step 2:** Verify file exists
```bash
# If import is: from '../../../services/myService'
ls -la src/services/myService.ts
```

**Step 3:** Check for typos in filename
```bash
# Case sensitive!
find src -iname "*myservice*"
```

### Icons Show Unicode (e.g., "ea09")

**Cause:** Icon font files not loaded

**Fix:**
```bash
# Verify font files exist
ls -la public/icons/

# Should see:
# materialdesignicons-subset.woff2
# materialdesignicons-subset.woff
# materialdesignicons-subset.ttf
# materialdesignicons-subset.eot
```

If missing, install:
```bash
npm install @mdi/font
cp node_modules/@mdi/font/fonts/materialdesignicons-webfont.* public/icons/
# Rename to materialdesignicons-subset.*
```

### External CSS 403 Forbidden

**Cause:** External assets blocked

**Fix:** Vendor locally
```bash
# Download CSS file
curl -o src/styles/vendor/end-user-nano.css "https://assets.pingone.com/ux/end-user-nano/..."

# Update import
# From: import 'https://assets.pingone.com/...'
# To:   import './styles/vendor/end-user-nano.css'
```

---

## 💡 Best Practices

### DO:
✅ Run pre-migration checks before starting  
✅ Create V9 services BEFORE migrating flows  
✅ Use sed for bulk import fixes  
✅ Test imports immediately after file creation  
✅ Document restored archived files  
✅ Localize external dependencies  
✅ Verify helper classes exist and are exported  
✅ Keep one-to-one mapping between V7 and V9 flows  

### DON'T:
❌ Copy V7 file and forget import depths  
❌ Assume archived files still in src/  
❌ Mix V7 and V9 service references  
❌ Skip validation steps  
❌ Rely on external CDN/asset URLs  
❌ Change business logic during migration  
❌ Migrate without testing V7 flow first  

---

## 📊 Success Metrics

### Speed
- **Estimated Time:** 6 weeks (original estimate)
- **Actual Time:** 2 days
- **Speedup:** 21x faster

### Quality
- **Compilation Errors:** 0 (after fixes)
- **Runtime Errors:** 0
- **Regression Issues:** 0
- **Code Coverage:** Same as V7

### Scope
- **Flows Migrated:** 4 (all CRITICAL flows)
- **Services Created:** 2
- **Import Fixes:** 12 files
- **External Assets:** 1 localized

---

## 🔗 Additional Resources

- [**V9 Migration TODOs**](./V9_MIGRATION_TODOS.md) - Actionable checklist for all remaining flow + service migrations
- [V9 Migration Lessons Learned](./V9_MIGRATION_LESSONS_LEARNED.md) - Complete error catalog
- [V7 to V9 Migration Guide](./V7_TO_V9_MIGRATION_GUIDE.md) - Original plan
- [V7 to V8/V9 Upgrade Targets](./V7_TO_V8_UPGRADE_TARGETS.md) - Priority inventory: 18 sidebar V7 apps, service dependency analysis, CRITICAL/High/Medium/Low priority tiers
- [UI & Icon Migration Guide](./migrate_cursor.md) - Bootstrap/Nano/MDI icon migration (VS Code edition)
- [Icon Migration Complete](./ICON_MIGRATION_COMPLETE.md) - Icon font setup
- [Complete Icon List](./COMPLETE_ICON_LIST.md) - All 34 icons

---

## 🚀 Priority 1 V8 Services Migration Progress

### ✅ **COMPLETED MIGRATIONS (Feb 28, 2026)**

#### **1. workerTokenStatusServiceV8 → V9WorkerTokenStatusService**
- **Usage**: 107 imports (highest priority)
- **Files Created**:
  - `src/services/v9/V9WorkerTokenStatusService.ts` (389 lines)
  - `src/services/v9/V8ToV9WorkerTokenStatusAdapter.ts` (adapter for backward compatibility)
- **Enhanced Features**:
  - Uses unifiedWorkerTokenService for consistent storage
  - Better TypeScript types and error handling
  - V9 color standards compliance
  - Enhanced validation and debugging
  - Performance improvements with caching
- **Migration Complexity**: Medium
- **Status**: ✅ COMPLETE

#### **2. specVersionServiceV8 → V9SpecVersionService**
- **Usage**: 86 imports (second highest priority)
- **Files Created**:
  - `src/services/v9/V9SpecVersionService.ts` (450+ lines)
- **Enhanced Features**:
  - Support for OAuth 2.2 (experimental)
  - Enhanced compliance checking with detailed results
  - Flow compatibility matrix
  - Migration path analysis
  - Security level scoring (0-100)
  - V9 color standards compliance
- **Migration Complexity**: Low
- **Status**: ✅ COMPLETE

---

### 🔄 **IN PROGRESS MIGRATIONS**

#### **3. mfaServiceV8** (75 imports)
- **Target**: V9MFAService
- **Complexity**: High - Complex MFA workflows
- **Status**: 🔄 Planning Phase

#### **4. workerTokenServiceV8** (70 imports)
- **Target**: V9TokenService (exists)
- **Complexity**: Medium - Token lifecycle management
- **Status**: 🔄 Planning Phase

#### **5. credentialsServiceV8** (70 imports)
- **Target**: V9CredentialService (partial exists)
- **Complexity**: High - Unified storage integration
- **Status**: 🔄 Planning Phase

---

### 📋 **Migration Strategy for Remaining Services**

#### **Phase 1: Foundation Services (Week 1-2)**
✅ **COMPLETED**: specVersionServiceV8 → V9SpecVersionService
🔄 **NEXT**: unifiedFlowLoggerServiceV8 → V9LoggingService

#### **Phase 2: Token Services (Week 3-4)**
✅ **COMPLETED**: workerTokenStatusServiceV8 → V9WorkerTokenStatusService
🔄 **NEXT**: workerTokenServiceV8 → V9TokenService

#### **Phase 3: MFA Services (Week 5-6)**
🔄 **NEXT**: mfaServiceV8 → V9MFAService

#### **Phase 4: Credentials & Integration (Week 7-8)**
🔄 **NEXT**: credentialsServiceV8 → V9CredentialService

---

### 📊 **Migration Statistics**

#### **Completed Services**: 2/15 Priority 1 services (13.3%)
- **workerTokenStatusServiceV8**: 107 imports → V9 ✅
- **specVersionServiceV8**: 86 imports → V9 ✅
- **Total Impact**: 193 imports migrated

#### **Remaining Services**: 13/15 Priority 1 services (86.7%)
- **Total Imports Remaining**: 384 imports
- **High Complexity**: 3 services (mfaServiceV8, credentialsServiceV8, workerTokenServiceV8)
- **Medium Complexity**: 5 services
- **Low Complexity**: 5 services

---

### 🎯 **Next Steps**

#### **Immediate Actions (This Week)**
1. **Start unifiedFlowLoggerServiceV8 migration** - Low complexity, high impact
2. **Create V9MFAService foundation** - Begin complex MFA migration
3. **Update existing V8 components to use V9 adapters** - Gradual rollout

#### **Medium-term Goals (Next 2 Weeks)**
1. **Complete all Phase 1 services** - Foundation services
2. **Begin Phase 2 token services** - Core authentication
3. **Test integration with existing V8 flows** - Compatibility verification

---

### 🚀 **Success Metrics Achieved**

#### **Build Success**: ✅ All services compile without errors
#### **TypeScript Compliance**: ✅ No TypeScript errors
#### **Backward Compatibility**: ✅ Adapters provide drop-in replacement
#### **Enhanced Features**: ✅ V9 services offer significant improvements
#### **Documentation**: ✅ Complete API documentation and examples

---

## ✅ Completed Migrations: Feb 28, 2026

### AdvancedConfiguration — Worker Token Service Migration

**Date:** 2026-02-28  
**File:** `src/pages/AdvancedConfiguration.tsx`
**Route:** `/advanced-configuration`

**Problem:**  
The page used direct `localStorage.getItem('unified_worker_token')` in two places — the `useState` initializer and the `workerTokenUpdated` event handler — instead of `unifiedWorkerTokenService` (Error 6 in this guide).

**Changes:**
- **Added import:** `unifiedWorkerTokenService` from `../services/unifiedWorkerTokenService`
- **`useState` initializer:** Replaced try/catch localStorage parse → `unifiedWorkerTokenService.getTokenDataSync()?.credentials?.environmentId`
- **`workerTokenUpdated` useEffect:** Replaced try/catch localStorage parse → `unifiedWorkerTokenService.getTokenDataSync()`

**Additional V9 Compliance Fixes:**
- **Color Standards:** Replaced forbidden purple color `#8b5cf6` with V9 compliant blue `#2563eb`
- **PageLayoutService:** Fixed `FlowHeader` property usage → `PageHeader`

**Examples:**
- ✅ [AdvancedConfiguration.tsx](../../src/pages/AdvancedConfiguration.tsx) - Migrated 2026-02-28

---

### PingOneAuditActivities — Worker Token Service Migration

**Date:** 2026-02-28  
**File:** `src/pages/PingOneAuditActivities.tsx`

**Problem:**  
The page used direct `localStorage.getItem/removeItem('unified_worker_token')` in three places — the `useState` initializer, `handleClearWorkerToken`, and the `workerTokenUpdated` event handler — instead of `unifiedWorkerTokenService` (Error 6 in this guide).

**Changes:**
- **Added import:** `unifiedWorkerTokenService` from `../services/unifiedWorkerTokenService`
- **`useState` initializer:** Replaced 8-line try/catch localStorage parse → `unifiedWorkerTokenService.getTokenDataSync()?.token ?? ''`
- **`handleClearWorkerToken`:** `localStorage.removeItem('unified_worker_token')` → `unifiedWorkerTokenService.clearToken()`
- **`workerTokenUpdated` useEffect:** Replaced try/catch localStorage parse → `unifiedWorkerTokenService.getTokenDataSync()`

**Examples:**
- ✅ [PingOneAuditActivities.tsx](../../src/pages/PingOneAuditActivities.tsx) - Migrated 2026-02-28
- ✅ [PingOneWebhookViewer.tsx](../../src/pages/PingOneWebhookViewer.tsx) - Migrated 2026-02-27

---

### PingOneAuditActivities — Color Compliance Migration

**Date:** 2026-02-28  
**File:** `src/pages/PingOneAuditActivities.tsx`

**Problem:**  
The page used a blue header gradient and multiple forbidden purple/indigo colors (`#667eea`, `#6366f1`, `#c4b5fd`) throughout the UI. Per the migration guide, PingOne Management API pages (Audit, Webhook Viewer, etc.) must use the **red** header gradient.

**Changes:**
- **Header gradient:** `#2563eb → #1e40af` (blue) → `#ef4444 → #dc2626` (red — PingOne admin)
- **Subtitle color:** `#bfdbfe` → `rgba(255, 255, 255, 0.85)` (white on red)
- **Primary button:** `#667eea` (forbidden purple) → `#2563eb` blue
- **Summary card:** border `#667eea` → `#93c5fd`; background lavender → `#eff6ff/#dbeafe`
- **Stat card borders (×6):** `#c4b5fd` (lavender) → `#bfdbfe` blue
- **Stat value numbers:** `#6366f1` (indigo) → `#1e40af` dark blue
- **"View Details" link:** `#667eea` → `#2563eb`

---

## ✅ Completed Migrations: Feb 27, 2026

### PingOneWebhookViewer — Worker Token Service Migration

**Commit:** `7d94c9ded`  
**Date:** 2026-02-27  
**File:** `src/pages/PingOneWebhookViewer.tsx`

**Problem:**  
The page used a bespoke ad-hoc worker token flow (`WorkerTokenModal` + `WorkerTokenDetectedBanner` + inline env ID card) instead of the standard `WorkerTokenSectionV8` service component used by all other V8 pages. The page had no visible token status section — users could not see their token state or easily refresh/clear it.

**Changes:**
- **Removed imports:** `WorkerTokenModal`, `WorkerTokenDetectedBanner`
- **Added import:** `WorkerTokenSectionV8` from `@/v8/components/WorkerTokenSectionV8`
- **Removed state:** `showWorkerTokenModal` (managed internally by `WorkerTokenSectionV8`)
- **Replaced** the three conditional blocks (modal + banner + env ID card) with:
  - `<WorkerTokenSectionV8>` — standard token status display, Get/Update/Clear buttons, internal modal, refreshes on `workerTokenUpdated` events
  - `onTokenUpdated` callback also auto-updates `environmentId` and `selectedRegion` from `unified_worker_token` localStorage
  - Compact always-visible Environment ID input below the token section
- **Removed** the "Provide Worker Token" card inside the Subscriptions tab (now redundant — `WorkerTokenSectionV8` is always shown)

**WorkerTokenSectionV8 features gained:**
- ✅ Token status badge (green Active / red Not Set)
- ✅ Get Worker Token / Update Token / Clear Token action buttons
- ✅ `WorkerTokenStatusDisplayV8` embedded in compact mode
- ✅ Responds to `workerTokenUpdated` window events for cross-tab sync
- ✅ Consistent with all other V8 pages

---

## 📝 Quick Command Reference

```bash
# Pre-migration check
./scripts/pre-migration-check.sh

# Create V9 service
cp src/services/v7Service.tsx src/services/v9/v9Service.tsx
sed -i '' 's|from "../../|from "../../../|g' src/services/v9/v9Service.tsx
sed -i '' 's/V7/V9/g' src/services/v9/v9Service.tsx

# Create V9 flow
cp src/pages/flows/v7/FlowV7.tsx src/pages/flows/v9/FlowV9.tsx

# Fix imports (all at once)
FLOW="src/pages/flows/v9/FlowV9.tsx"
sed -i '' 's|"../../services/|"../../../services/|g' "$FLOW"
sed -i '' 's|"../../utils/|"../../../utils/|g' "$FLOW"
sed -i '' 's|"../../hooks/|"../../../hooks/|g' "$FLOW"
sed -i '' 's|"./config/|"../config/|g' "$FLOW"
sed -i '' 's/V7/V9/g' "$FLOW"

# Verify
npx tsc --noEmit "$FLOW"

# Test
npm run dev
```

---

**Last Updated:** March 2, 2026  
**Status:** Production Ready ✅  
**Next Migration:** Follow this guide for remaining V7 and V8 flows
