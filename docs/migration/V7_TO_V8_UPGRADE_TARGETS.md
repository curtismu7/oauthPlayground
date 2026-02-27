# V7 to V8/V9 Upgrade Target List

**V7 files:** 75
**V8 files:** 558
**V9 files:** 3

## V7 Apps Currently in Sidebar Menu (18 apps)

These V7 flows are actively exposed in the sidebar navigation and should be prioritized for V8/V9 migration.

### OAuth 2.0 Flows (4 V7 apps)
| Path | Label | Menu Group | Priority |
|------|-------|------------|----------|
| `/flows/oauth-authorization-code-v7-2` | Authorization Code (V7.2) | OAuth 2.0 Flows | **CRITICAL** |
| `/flows/implicit-v7` | Implicit Flow (V7) | OAuth 2.0 Flows | **CRITICAL** |
| `/flows/device-authorization-v7` | Device Authorization (V7) | OAuth 2.0 Flows | **CRITICAL** |
| `/flows/client-credentials-v7` | Client Credentials (V7) | OAuth 2.0 Flows | **CRITICAL** |

### OpenID Connect (3 V7 apps)
| Path | Label | Menu Group | Priority |
|------|-------|------------|----------|
| `/flows/oauth-authorization-code-v7-2` | Authorization Code (V7.2) | OpenID Connect | **CRITICAL** |
| `/flows/implicit-v7?variant=oidc` | Implicit Flow (V7) | OpenID Connect | **CRITICAL** |
| `/flows/device-authorization-v7?variant=oidc` | Device Authorization (V7 – OIDC) | OpenID Connect | **CRITICAL** |
| `/flows/oidc-hybrid-v7` | Hybrid Flow (V7) | OpenID Connect | High |

### PingOne Flows (4 V7 apps)
| Path | Label | Menu Group | Priority |
|------|-------|------------|----------|
| `/flows/pingone-par-v7` | Pushed Authorization Request (V7) | PingOne Flows | High |
| `/flows/redirectless-v7-real` | Redirectless Flow (V7) | PingOne Flows | Medium |
| `/flows/pingone-complete-mfa-v7` | PingOne MFA (V7) | PingOne Flows | High |
| `/flows/pingone-mfa-workflow-library-v7` | PingOne MFA Workflow Library (V7) | PingOne Flows | High |

### Tokens & Session (1 V7 app)
| Path | Label | Menu Group | Priority |
|------|-------|------------|----------|
| `/flows/worker-token-v7` | Worker Token (V7) | Tokens & Session | High |

### Unified & Production Flows (1 V7 app)
| Path | Label | Menu Group | Priority |
|------|-------|------------|----------|
| `/flows/token-exchange-v7` | Token Exchange (V8M) | Unified & Production Flows | **CRITICAL** |

### Mock & Educational Flows (5 V7 apps)
| Path | Label | Menu Group | Priority |
|------|-------|------------|----------|
| `/flows/jwt-bearer-token-v7` | JWT Bearer Token (V7) | OAuth Mock Flows | Medium |
| `/flows/saml-bearer-assertion-v7` | SAML Bearer Assertion (V7) | OAuth Mock Flows | Medium |
| `/flows/oauth-ropc-v7` | Resource Owner Password (V7) | OAuth Mock Flows | Medium |
| `/flows/oauth-authorization-code-v7-condensed-mock` | Auth Code Condensed (Mock) | OAuth Mock Flows | Low |
| `/flows/v7-condensed-mock` | V7 Condensed (Prototype) | OAuth Mock Flows | Low |
| `/flows/rar-v7` | RAR Flow (V7) | Advanced Mock Flows | Medium |

### Summary
- **CRITICAL Priority**: 7 apps (core OAuth/OIDC flows, user-facing)
- **High Priority**: 4 apps (PingOne-specific features)
- **Medium Priority**: 5 apps (educational/mock flows)
- **Low Priority**: 2 apps (prototype/demo flows)

---

## V7 Service Dependencies Analysis (CRITICAL 4 Apps)

Analysis of the 4 CRITICAL OAuth flows to identify V7 services that can be removed after migration.

**What are "Shared Services"?**
- **Shared Services** = Version-agnostic services used by V7, V8, and V9 flows (e.g., `comprehensiveCredentialsService`, `flowUIService`, `unifiedTokenDisplayService`)
- **V7 Services** = V7-specific services with names like `v7*` or in `services/v7m/` directory (e.g., `v7CredentialValidationService`)
- ✅ Flows using **only shared services** have NO V7 dependencies and can be safely archived after V8 migration

| Flow | Component File | V7 Services Used | V7 Configs Used | Shared Services Used | Can Remove After Migration? |
|------|----------------|-------------------|-----------------|---------------------|---------------------------|
| Authorization Code (V7.2) | `OAuthAuthorizationCodeFlowV7_2.tsx` | ✅ None | `OAuthAuthzCodeFlowV7.config.ts` | ✅ Yes (comprehensiveCredentials, flowUI, etc.) | ✅ **YES** - Only V7 dependency is 1 config file |
| Implicit Flow (V7) | `ImplicitFlowV7.tsx` | ✅ None | ✅ None | ✅ Yes (flowUI, unifiedTokenDisplay, etc.) | ✅ **YES** - Zero V7 dependencies |
| Device Authorization (V7) | `DeviceAuthorizationFlowV7.tsx` | ⚠️ `v7CredentialValidationService` | ✅ None | ✅ Yes (comprehensiveCredentials, flowUI, etc.) | ⚠️ **PARTIAL** - Has 1 V7 service dependency |
| Client Credentials (V7) | `ClientCredentialsFlowV7_Complete.tsx` | ✅ None | ✅ None | ✅ Yes (comprehensiveCredentials, flowUI, etc.) | ✅ **YES** - Zero V7 dependencies |

### V7 Dependencies Summary

**What This Means:** DONE
- ✅ **"Shared Services"** = These services are used by BOTH V7 and V8 flows. They are version-agnostic.
  - Examples: `comprehensiveCredentialsService`, `flowUIService`, `unifiedTokenDisplayService`, `copyButtonService`
  - Location: `services/` (not in `services/v7m/` or named `v7*`)
  - **These are NOT V7-specific** - they're common infrastructure
  - When you migrate V7 → V8, you keep using these same shared services

- ⚠️ **"V7 Services"** = These are V7-SPECIFIC services that only V7 flows use
  - Naming pattern: `v7*` (e.g., `v7CredentialValidationService`)
  - Location: `services/v7m/` directory or named with `v7` prefix
  - **These ARE V7-specific** - they should be archived when V7 flows are migrated
  - Only 1 V7 service is in use: `v7CredentialValidationService`

**V7 Services in Use:**
1. `services/v7CredentialValidationService.tsx` - Used ONLY by DeviceAuthorizationFlowV7

**V7 Config Files in Use:**
1. `pages/flows/config/OAuthAuthzCodeFlowV7.config.ts` - Used ONLY by OAuthAuthorizationCodeFlowV7_2

**Cleanup Potential:**
- ✅ **3 out of 4** flows (75%) have NO V7 service dependencies
- ⚠️ **1 flow** (25%) depends on `v7CredentialValidationService`
- 📦 **1 config file** can be archived after migrating Authorization Code V7.2

**V7 Service Usage Verification:**
- ✅ `v7CredentialValidationService` is **ONLY** used by `DeviceAuthorizationFlowV7.tsx`
- ✅ No other pages or hooks import this service
- ✅ Service can be safely archived once DeviceAuthorizationFlowV7 is migrated to V8

**Example: Client Credentials V7 Services (All Shared, Not V7-Specific):**
```typescript
// ClientCredentialsFlowV7_Complete.tsx imports:
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';  // ✅ Shared
import { CopyButtonService } from '../../services/copyButtonService';                          // ✅ Shared
import { FlowCredentialService } from '../../services/flowCredentialService';                  // ✅ Shared
import FlowUIService from '../../services/flowUIService';                                      // ✅ Shared
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';        // ✅ Shared
// ❌ No v7* services imported!
// ✅ All services are version-agnostic and used by V8 flows too
```

**Why This Matters:**
- When you migrate Client Credentials to V8, you just archive the V7 component file
- The shared services it uses continue working with V8 (they're already V8-compatible)
- No service refactoring needed - just swap the component!

**Action Items:**
1. **Immediate**: Migrate 3 flows with no V7 dependencies (Authorization Code V7.2, Implicit, Client Credentials)
2. **After DeviceAuthorizationFlowV7 migration**: Archive `v7CredentialValidationService.tsx` and its test file
3. **After Authorization Code V7.2 migration**: Archive `OAuthAuthzCodeFlowV7.config.ts` config file

**Files Ready for Archival After Migration:**
```
To archive after all 4 CRITICAL flows migrated:
- services/v7CredentialValidationService.tsx
- services/__tests__/v7CredentialValidationService.test.ts
- pages/flows/config/OAuthAuthzCodeFlowV7.config.ts
```

---

## Files with V8/V9 Equivalents (11 files)

| V7 File | V8 Equivalent | Type | Priority |
|---------|---------------|------|----------|
| `components/CompleteMFAFlowV7.tsx` | `v8/flows/CompleteMFAFlowV8.tsx` | Page/Component | High |
| `hooks/useCibaFlowV7.ts` | `v8/hooks/useCibaFlowV8.ts` | Hook | High |
| `pages/flows/AuthorizationCodeFlowV7.tsx` | `pages/DpopAuthorizationCodeFlowV8.tsx` | Page/Component | High |
| `pages/flows/CIBAFlowV7.tsx` | `v8/flows/CIBAFlowV8.tsx` | Page/Component | High |
| `pages/flows/ImplicitFlowV7.tsx` | `v8/flows/ImplicitFlowV8.tsx` | Page/Component | High |
| `pages/flows/OAuthAuthorizationCodeFlowV7.tsx` | `v8/flows/OAuthAuthorizationCodeFlowV8.tsx` | Page/Component | High |
| `pages/flows/OIDCHybridFlowV7.tsx` | `v8/flows/OIDCHybridFlowV8.tsx` | Page/Component | High |
| `pages/flows/PARFlowV7.tsx` | `v8/flows/PingOnePARFlowV8/PingOnePARFlowV8.tsx` | Page/Component | High |
| `pages/flows/PingOnePARFlowV7.tsx` | `v8/flows/PingOnePARFlowV8/PingOnePARFlowV8.tsx` | Page/Component | High |
| `pages/flows/TokenExchangeFlowV7.tsx` | `v8/flows/TokenExchangeFlowV8.tsx` | Page/Component | High |
| `pages/flows/config/OAuthAuthzCodeFlowV7.config.ts` | `pages/flows/config/OAuthAuthzCodeFlowV8.config.ts` | TypeScript | High |

## V7 Files Without V8/V9 Equivalents (64 files)

These files may still be in active use or need manual review.

| V7 File | Type |
|---------|------|
| `components/flow/createV7RMOIDCResourceOwnerPasswordSteps.tsx` | Page/Component |
| `examples/V7ServicesIntegrationExample.tsx` | Page/Component |
| `hooks/useAuthorizationCodeFlowV7Controller.ts` | Hook |
| `hooks/useHybridFlowControllerV7.ts` | Hook |
| `hooks/useResourceOwnerPasswordFlowV7.ts` | Hook |
| `hooks/useV7RMOIDCResourceOwnerPasswordController.ts` | Hook |
| `pages/docs/OIDCOverviewV7.tsx` | Page/Component |
| `pages/flows/ClientCredentialsFlowV7.tsx` | Page/Component |
| `pages/flows/ClientCredentialsFlowV7_Complete.tsx` | Page/Component |
| `pages/flows/ClientCredentialsFlowV7_Simple.tsx` | Page/Component |
| `pages/flows/DeviceAuthorizationFlowV7.tsx` | Page/Component |
| `pages/flows/ExampleV7Flow.tsx` | Page/Component |
| `pages/flows/JWTBearerTokenFlowV7.tsx` | Page/Component |
| `pages/flows/MFALoginHintFlowV7.tsx` | Page/Component |
| `pages/flows/OAuthAuthorizationCodeFlowV7_1/OAuthAuthorizationCodeFlowV7_1.tsx` | Page/Component |
| `pages/flows/OAuthAuthorizationCodeFlowV7_2.tsx` | Page/Component |
| `pages/flows/OAuthAuthorizationCodeFlowV7_BACKUP_20251016_083921.tsx` | Page/Component |
| `pages/flows/OAuthAuthorizationCodeFlowV7_Hybrid.tsx` | Page/Component |
| `pages/flows/OAuthAuthorizationCodeFlowV7_Incomplete_Backup.tsx` | Page/Component |
| `pages/flows/OAuthAuthorizationCodeFlowV7_PAR_Backup.tsx` | Page/Component |
| `pages/flows/OAuthROPCFlowV7.tsx` | Page/Component |
| `pages/flows/PingOneCompleteMFAFlowV7.tsx` | Page/Component |
| `pages/flows/PingOneMFAWorkflowLibraryV7.tsx` | Page/Component |
| `pages/flows/RARFlowV7.tsx` | Page/Component |
| `pages/flows/SAMLBearerAssertionFlowV7.tsx` | Page/Component |
| `pages/flows/V7RMCondensedMock.tsx` | Page/Component |
| `pages/flows/V7RMOAuthAuthorizationCodeFlow_Condensed.tsx` | Page/Component |
| `pages/flows/V7RMOIDCResourceOwnerPasswordFlow.tsx` | Page/Component |
| `pages/flows/WorkerTokenFlowV7.tsx` | Page/Component |
| `pages/flows/config/OIDCHybridFlowV7.config.ts` | TypeScript |
| `services/__tests__/v7CredentialValidationService.test.ts` | Service |
| `services/v7CredentialValidationService.tsx` | Page/Component |
| `services/v7EducationalContentDataService.ts` | Service |
| `services/v7EducationalContentService.ts` | Service |
| `services/v7StepperService.tsx` | Page/Component |
| `services/v7m/V7MAuthorizeService.ts` | Service |
| `services/v7m/V7MDeviceAuthorizationService.ts` | Service |
| `services/v7m/V7MIntrospectionService.ts` | Service |
| `services/v7m/V7MStateStore.ts` | Service |
| `services/v7m/V7MTokenGenerator.ts` | Service |
| `services/v7m/V7MTokenService.ts` | Service |
| `services/v7m/V7MUserInfoService.ts` | Service |
| `services/v7m/__tests__/V7MTokenGenerator.test.ts` | Service |
| `services/v7m/__tests__/V7MTokenService.test.ts` | Service |
| `services/v7m/core/V7MFlowCredentialService.ts` | Service |
| `services/v7m/core/V7MOAuthErrorHandlingService.ts` | Service |
| `services/v7m/core/V7MPKCEGenerationService.ts` | Service |
| `services/v7m/ui/V7MCollapsibleHeader.tsx` | Page/Component |
| `services/v7m/ui/V7MFlowHeader.tsx` | Page/Component |
| `services/v7m/ui/V7MFlowUIService.ts` | Service |
| `services/v7m/ui/V7MUnifiedTokenDisplayService.tsx` | Page/Component |
| `templates/V7FlowTemplate.tsx` | Page/Component |
| `templates/V7FlowVariants.tsx` | Page/Component |
| `tests/v7ServicesTestSuite.ts` | Service |
| `utils/updateV7FlowsCredentialBackup.ts` | TypeScript |
| `v7/components/V7MHelpModal.tsx` | Page/Component |
| `v7/components/V7MInfoIcon.tsx` | Page/Component |
| `v7/components/V7MJwtInspectorModal.tsx` | Page/Component |
| `v7/pages/V7MClientCredentials.tsx` | Page/Component |
| `v7/pages/V7MDeviceAuthorization.tsx` | Page/Component |
| `v7/pages/V7MImplicitFlow.tsx` | Page/Component |
| `v7/pages/V7MOAuthAuthCode.tsx` | Page/Component |
| `v7/pages/V7MROPC.tsx` | Page/Component |
| `v7/pages/V7MSettings.tsx` | Page/Component |

---

## Cross-Reference: Sidebar V7 Apps vs V8/V9 Equivalents

This section maps the 18 V7 apps in the sidebar menu to their upgrade status.

### ✅ Sidebar V7 Apps WITH V8/V9 Equivalents (5 apps)

These sidebar apps can be upgraded immediately - V8 versions exist:

| Sidebar Path | V7 Component | V8 Equivalent | Menu Location | Priority |
|--------------|--------------|---------------|---------------|----------|
| `/flows/oauth-authorization-code-v7-2` | `OAuthAuthorizationCodeFlowV7.tsx` | `v8/flows/OAuthAuthorizationCodeFlowV8.tsx` | OAuth 2.0 Flows | **CRITICAL** |
| `/flows/implicit-v7` | `ImplicitFlowV7.tsx` | `v8/flows/ImplicitFlowV8.tsx` | OAuth 2.0 Flows | **CRITICAL** |
| `/flows/oidc-hybrid-v7` | `OIDCHybridFlowV7.tsx` | `v8/flows/OIDCHybridFlowV8.tsx` | OpenID Connect | High |
| `/flows/pingone-par-v7` | `PingOnePARFlowV7.tsx` | `v8/flows/PingOnePARFlowV8/PingOnePARFlowV8.tsx` | PingOne Flows | High |
| `/flows/token-exchange-v7` | `TokenExchangeFlowV7.tsx` | `v8/flows/TokenExchangeFlowV8.tsx` | Unified & Production Flows | **CRITICAL** |

### ⚠️ Sidebar V7 Apps WITHOUT V8/V9 Equivalents (13 apps)

These sidebar apps need V8 versions created or require manual review:

| Sidebar Path | Component File | Menu Location | Priority | Action Needed |
|--------------|----------------|---------------|----------|---------------|
| `/flows/device-authorization-v7` | `DeviceAuthorizationFlowV7.tsx` | OAuth 2.0 Flows | **CRITICAL** | Create V8 version |
| `/flows/client-credentials-v7` | `ClientCredentialsFlowV7.tsx` | OAuth 2.0 Flows | **CRITICAL** | Create V8 version |
| `/flows/redirectless-v7-real` | (TBD - check source) | PingOne Flows | Medium | Identify source file |
| `/flows/pingone-complete-mfa-v7` | `PingOneCompleteMFAFlowV7.tsx` | PingOne Flows | High | Create V8 version |
| `/flows/pingone-mfa-workflow-library-v7` | `PingOneMFAWorkflowLibraryV7.tsx` | PingOne Flows | High | Create V8 version |
| `/flows/worker-token-v7` | `WorkerTokenFlowV7.tsx` | Tokens & Session | High | Create V8 version |
| `/flows/jwt-bearer-token-v7` | `JWTBearerTokenFlowV7.tsx` | OAuth Mock Flows | Medium | Create V8 version or archive |
| `/flows/saml-bearer-assertion-v7` | `SAMLBearerAssertionFlowV7.tsx` | OAuth Mock Flows | Medium | Create V8 version or archive |
| `/flows/oauth-ropc-v7` | `OAuthROPCFlowV7.tsx` | OAuth Mock Flows | Medium | Create V8 version or archive |
| `/flows/oauth-authorization-code-v7-condensed-mock` | `V7RMOAuthAuthorizationCodeFlow_Condensed.tsx` | OAuth Mock Flows | Low | Archive or migrate |
| `/flows/v7-condensed-mock` | `V7RMCondensedMock.tsx` | OAuth Mock Flows | Low | Archive or migrate |
| `/flows/rar-v7` | `RARFlowV7.tsx` | Advanced Mock Flows | Medium | Create V8 version or archive |
| (V7.2 instances) | `OAuthAuthorizationCodeFlowV7_2.tsx` | Multiple | **CRITICAL** | Verify if separate from V7 |

### 📊 Upgrade Impact Analysis

**Immediate Migration Opportunity:**
- **5 sidebar apps** (28%) can be upgraded to V8 today
- Focuses on **CRITICAL** and **High** priority flows
- Affects core OAuth/OIDC and PingOne features

**V8 Creation Needed:**
- **13 sidebar apps** (72%) need V8 versions created
- Includes **4 CRITICAL** priority flows (device-authorization, client-credentials)
- Mix of production and educational/mock flows

**Recommended Approach:**
1. **Phase 1**: Upgrade 5 apps with existing V8 equivalents (quick wins)
2. **Phase 2**: Create V8 for CRITICAL flows (device-authorization, client-credentials)
3. **Phase 3**: Create V8 for High priority PingOne flows
4. **Phase 4**: Evaluate mock/educational flows - migrate or archive

---

## Quick Reference: V7 Cleanup Checklist

### ✅ Clean Migration (No V7 Dependencies)

These 3 flows can be migrated to V8 and their V7 versions immediately archived:

1. **Authorization Code V7.2** (`/flows/oauth-authorization-code-v7-2`)
   - File: `OAuthAuthorizationCodeFlowV7_2.tsx`
   - Status: V8 exists (`v8/flows/OAuthAuthorizationCodeFlowV8.tsx`)
   - Dependencies: Only 1 config file
   - Archive: `pages/flows/config/OAuthAuthzCodeFlowV7.config.ts`

2. **Implicit Flow V7** (`/flows/implicit-v7`)
   - File: `ImplicitFlowV7.tsx`
   - Status: V8 exists (`v8/flows/ImplicitFlowV8.tsx`)
   - Dependencies: ✅ NONE
   - Archive: Component file only

3. **Client Credentials V7** (`/flows/client-credentials-v7`)
   - File: `ClientCredentialsFlowV7.tsx` + `ClientCredentialsFlowV7_Complete.tsx`
   - Status: ⚠️ Need to create V8 version
   - Dependencies: ✅ NONE
   - Archive: Component files only

### ⚠️ Staged Migration (Has V7 Dependencies)

This flow requires dependency cleanup before archival:

4. **Device Authorization V7** (`/flows/device-authorization-v7`)
   - File: `DeviceAuthorizationFlowV7.tsx`
   - Status: ⚠️ Need to create V8 version
   - Dependencies: `v7CredentialValidationService` (EXCLUSIVE - no other usage)
   - Archive After Migration:
     - `DeviceAuthorizationFlowV7.tsx`
     - `services/v7CredentialValidationService.tsx`
     - `services/__tests__/v7CredentialValidationService.test.ts`

### 📦 Total V7 Files for Archival (After 4 CRITICAL Migrations)

```bash
# Component files (4 flows)
pages/flows/OAuthAuthorizationCodeFlowV7_2.tsx
pages/flows/ImplicitFlowV7.tsx
pages/flows/ClientCredentialsFlowV7.tsx
pages/flows/ClientCredentialsFlowV7_Complete.tsx
pages/flows/DeviceAuthorizationFlowV7.tsx

# Services (1 service)
services/v7CredentialValidationService.tsx
services/__tests__/v7CredentialValidationService.test.ts

# Config files (1 config)
pages/flows/config/OAuthAuthzCodeFlowV7.config.ts

# Total: 8 files can be archived after migrating these 4 CRITICAL flows
```

### 🎯 Migration Priority Order

**Week 1-2: Quick Wins (3 flows with V8 versions)**
1. Migrate `/flows/oauth-authorization-code-v7-2` → Use existing V8
2. Migrate `/flows/implicit-v7` → Use existing V8
3. Archive 2 component files + 1 config file

**Week 3-4: V8 Creation (2 flows need V8 versions)**
4. Create V8 for `/flows/client-credentials-v7`
5. Create V8 for `/flows/device-authorization-v7` (includes v7 service migration)
6. Archive 3 component files + 1 service + 1 test file

**Result**: 4 CRITICAL V7 flows eliminated, 8 V7 files archived


