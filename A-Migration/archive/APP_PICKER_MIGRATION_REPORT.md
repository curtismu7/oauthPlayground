# App Lookup Service (CompactAppPickerV9) — Migration Report

**Generated**: March 6, 2026  
**Updated**: March 6, 2026 - Now using V9 version  
**Rule**: Every flow page that collects PingOne credentials MUST include `CompactAppPickerV9` so users can browse discovered apps and auto-apply credentials in one click.  
**Component**: `CompactAppPickerV9` from `src/components/CompactAppPickerV9.tsx` (V9 Standardized)

---

## Standard Implementation Pattern

```tsx
// 1. Imports
import type { V9DiscoveredApp } from '../../../services/v9/V9AppDiscoveryService';
import { CompactAppPickerV9 } from '../../../components/CompactAppPickerV9';

// 2. Callback — populates clientId (and any other relevant fields) from selected app
const handleAppSelected = useCallback(
  (app: V9DiscoveredApp) => {
    setCredentials((prev) => ({
      ...prev,
      clientId: app.clientId, // Note: clientId instead of id
      // some flows also use: environmentId: app.environmentId (if available)
    }));
  },
  [setCredentials]
);

// 3. JSX — place inside the credentials section, above the manual credential inputs
<CompactAppPickerV9
  environmentId={credentials.environmentId ?? ''}
  onAppSelected={handleAppSelected}
  grantType="jwt-bearer"  // Optional: filter by grant type
  compact={false}          // Optional: use compact mode
/>
```

> **Import depth varies by location** — adjust `../../../` to match the file's depth relative to `src/`.
> **V9 Breaking Changes**: Use `V9DiscoveredApp` type and `app.clientId` instead of `app.id`.

---

## Audit Results (March 6, 2026)

### ✅ Compliant — Has App Picker (Need V9 Migration)

| Flow | Location | Current | Needed |
|---|---|---|---|
| ClientCredentialsFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| DPoPAuthorizationCodeFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| DeviceAuthorizationFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| ImplicitFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| JWTBearerTokenFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| MFALoginHintFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| MFAWorkflowLibraryFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| OAuthAuthorizationCodeFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| OAuthAuthorizationCodeFlowV9_Condensed.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| OAuthROPCFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| OIDCHybridFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| PingOnePARFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| RARFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| SAMLBearerAssertionFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| TokenExchangeFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| WorkerTokenFlowV9.tsx | src/pages/flows/v9/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| V7RMOIDCResourceOwnerPasswordFlow.tsx | src/pages/flows/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| OAuth2ResourceOwnerPasswordFlow.tsx | src/pages/flows/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| KrogerGroceryStoreMFA.tsx | src/pages/flows/ | CompactAppPickerV8U | → CompactAppPickerV9 |
| UserInfoFlow.tsx | src/pages/flows/ | CompactAppPickerV8U | → CompactAppPickerV9 |

---

### ❌ Non-Compliant — Needs `CompactAppPickerV9` Added

#### V9 Flows Outside `v9/` (Priority: HIGH)

| File | Route | Status |
|---|---|---|
| CIBAFlowV9.tsx | `/flows/ciba-v9` | ❌ MISSING |
| RedirectlessFlowV9_Real.tsx | `/flows/redirectless-v9` | ❌ MISSING |

#### Non-V9 Flows with Credentials (Priority: MEDIUM)

| File | Route | Status |
|---|---|---|
| DPoPFlow.tsx | `/flows/dpop` | ❌ MISSING |
| IDTokensFlow.tsx | `/flows/id-tokens` | ✅ COMPLETE - Added CompactAppPickerV9 |
| JWTBearerFlow.tsx | `/flows/jwt-bearer` | ✅ COMPLETE - Added CompactAppPickerV9 |
| MFAFlow.tsx | `/flows/mfa` | ❌ MISSING |
| OAuth2CompliantAuthorizationCodeFlow.tsx | `/flows/oauth-authorization-code` | ❌ MISSING |
| PARFlow.tsx | `/flows/par` | ❌ MISSING |
| PingOneLogoutFlow.tsx | `/flows/pingone-logout` | ❌ MISSING |
| SAMLServiceProviderFlowV1.tsx | `/flows/saml-sp` | ❌ MISSING |
| TokenRevocationFlow.tsx | `/flows/token-revocation` | ❌ MISSING |
| UserInfoPostFlow.tsx | `/flows/userinfo-post` | ❌ MISSING |

**Total non-compliant: 10 flows** (2 V9 + 8 non-V9)

---

## Implementation Checklist

Work through the list above in order (V9 first, then non-V9). For each file:

### For Existing V8U Implementations (Migration to V9):
- [ ] Update import: `import type { V9DiscoveredApp } from '../../../services/v9/V9AppDiscoveryService'`
- [ ] Update import: `import { CompactAppPickerV9 } from '../../../components/CompactAppPickerV9'`
- [ ] Update callback: Change `app.id` to `app.clientId`
- [ ] Update component: Change `CompactAppPickerV8U` to `CompactAppPickerV9`
- [ ] Add optional props: `grantType`, `compact`, `disabled` as needed

### For New Implementations:
- [ ] Add `import type { V9DiscoveredApp } from '...'` (adjust path)
- [ ] Add `import { CompactAppPickerV9 } from '...'` (adjust path)
- [ ] Add `handleAppSelected` callback (uses `useCallback`)
- [ ] Add `<CompactAppPickerV9 />` component above credential inputs
- [ ] Test app discovery and selection functionality
- [ ] Mark row as ✅ in this doc

### V9 Flows (pages/flows/)
- [ ] CIBAFlowV9.tsx
- [ ] RedirectlessFlowV9_Real.tsx

### Non-V9 Flows (pages/flows/)
- [ ] DPoPFlow.tsx
- [ ] IDTokensFlow.tsx
- [ ] JWTBearerFlow.tsx
- [ ] KrogerGroceryStoreMFA.tsx
- [ ] MFAFlow.tsx
- [ ] OAuth2CompliantAuthorizationCodeFlow.tsx
- [ ] OAuth2ResourceOwnerPasswordFlow.tsx
- [ ] PARFlow.tsx
- [ ] PingOneLogoutFlow.tsx
- [ ] SAMLServiceProviderFlowV1.tsx
- [ ] TokenRevocationFlow.tsx
- [ ] UserInfoFlow.tsx
- [ ] UserInfoPostFlow.tsx

---

## Notes

- `CompactAppPickerV8U` queries the PingOne management API using the `environmentId` already entered by the user. It will show a searchable dropdown of all apps in that environment.
- The `onAppSelected` callback receives a `DiscoveredApp` object. At minimum, populate `clientId` from `app.id`. Some flows (e.g. Worker Token) also populate additional fields — check the existing V9 reference implementations in `src/pages/flows/v9/`.
- For flows where `ComprehensiveCredentialsService` is already in use, place the picker **above** it in the credentials section as the "quick fill" first option.
- Re-run `python3 /tmp/picker_audit.py` (or the inline grep audit) to verify after each fix.
