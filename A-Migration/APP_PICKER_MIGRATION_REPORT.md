# App Lookup Service (CompactAppPickerV8U) — Migration Report

**Generated**: March 6, 2026  
**Rule**: Every flow page that collects PingOne credentials MUST include `CompactAppPickerV8U` so users can browse discovered apps and auto-apply credentials in one click.  
**Component**: `CompactAppPickerV8U` from `src/v8u/components/CompactAppPickerV8U.tsx`

---

## Standard Implementation Pattern

```tsx
// 1. Imports
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

// 2. Callback — populates clientId (and any other relevant fields) from selected app
const handleAppSelected = useCallback(
  (app: DiscoveredApp) => {
    setCredentials((prev) => ({
      ...prev,
      clientId: app.id,
      // some flows also use: environmentId: app.environmentId (if available)
    }));
  },
  [setCredentials]
);

// 3. JSX — place inside the credentials section, above the manual credential inputs
<CompactAppPickerV8U
  environmentId={credentials.environmentId ?? ''}
  onAppSelected={handleAppSelected}
/>
```

> **Import depth varies by location** — adjust `../../../` to match the file's depth relative to `src/`.

---

## Audit Results (March 6, 2026)

### ✅ Compliant — Has `CompactAppPickerV8U`

| Flow | Location |
|---|---|
| ClientCredentialsFlowV9.tsx | src/pages/flows/v9/ |
| DPoPAuthorizationCodeFlowV9.tsx | src/pages/flows/v9/ |
| DeviceAuthorizationFlowV9.tsx | src/pages/flows/v9/ |
| ImplicitFlowV9.tsx | src/pages/flows/v9/ |
| JWTBearerTokenFlowV9.tsx | src/pages/flows/v9/ |
| MFALoginHintFlowV9.tsx | src/pages/flows/v9/ |
| MFAWorkflowLibraryFlowV9.tsx | src/pages/flows/v9/ |
| OAuthAuthorizationCodeFlowV9.tsx | src/pages/flows/v9/ |
| OAuthAuthorizationCodeFlowV9_Condensed.tsx | src/pages/flows/v9/ |
| OAuthROPCFlowV9.tsx | src/pages/flows/v9/ |
| OIDCHybridFlowV9.tsx | src/pages/flows/v9/ |
| PingOnePARFlowV9.tsx | src/pages/flows/v9/ |
| RARFlowV9.tsx | src/pages/flows/v9/ |
| SAMLBearerAssertionFlowV9.tsx | src/pages/flows/v9/ |
| TokenExchangeFlowV9.tsx | src/pages/flows/v9/ |
| WorkerTokenFlowV9.tsx | src/pages/flows/v9/ |
| V7RMOIDCResourceOwnerPasswordFlow.tsx | src/pages/flows/ |

---

### ❌ Non-Compliant — Needs `CompactAppPickerV8U` Added

#### V9 Flows Outside `v9/` (Priority: HIGH)

| File | Route | Status |
|---|---|---|
| CIBAFlowV9.tsx | `/flows/ciba-v9` | ❌ MISSING |
| RedirectlessFlowV9_Real.tsx | `/flows/redirectless-v9` | ❌ MISSING |

#### Non-V9 Flows with Credentials (Priority: MEDIUM)

| File | Route | Status |
|---|---|---|
| DPoPFlow.tsx | `/flows/dpop` | ❌ MISSING |
| IDTokensFlow.tsx | `/flows/id-tokens` | ❌ MISSING |
| JWTBearerFlow.tsx | `/flows/jwt-bearer` | ❌ MISSING |
| KrogerGroceryStoreMFA.tsx | `/flows/kroger-grocery-store-mfa` | ❌ MISSING |
| MFAFlow.tsx | `/flows/mfa` | ❌ MISSING |
| OAuth2CompliantAuthorizationCodeFlow.tsx | `/flows/oauth-authorization-code` | ❌ MISSING |
| OAuth2ResourceOwnerPasswordFlow.tsx | `/flows/ropc` | ❌ MISSING |
| PARFlow.tsx | `/flows/par` | ❌ MISSING |
| PingOneLogoutFlow.tsx | `/flows/pingone-logout` | ❌ MISSING |
| SAMLServiceProviderFlowV1.tsx | `/flows/saml-sp` | ❌ MISSING |
| TokenRevocationFlow.tsx | `/flows/token-revocation` | ❌ MISSING |
| UserInfoFlow.tsx | `/flows/userinfo` | ❌ MISSING |
| UserInfoPostFlow.tsx | `/flows/userinfo-post` | ❌ MISSING |

**Total non-compliant: 15 flows** (2 V9 + 13 non-V9)

---

## Implementation Checklist

Work through the list above in order (V9 first, then non-V9). For each file:

- [ ] Add `import type { DiscoveredApp } from '...'` (adjust path)
- [ ] Add `import { CompactAppPickerV8U } from '...'` (adjust path)
- [ ] Add `handleAppSelected` callback (uses `useCallback`)
- [ ] Render `<CompactAppPickerV8U environmentId={...} onAppSelected={handleAppSelected} />` inside credentials section
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
