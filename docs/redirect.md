# Redirect URI Architecture and Conventions

This document describes how redirect URIs and callback URLs are defined and used across OAuth/OIDC and MFA flows so that only the redirect URI differs by flow type and all flows use a consistent service.

---

## 1. Overview

- **Single source of truth for paths and base URL:** `RedirectUriServiceV8` (`src/v8/services/redirectUriServiceV8.ts`) holds the canonical mapping of flow keys to callback paths and provides `getBaseUrl()` (custom domain–aware).
- **Unified OAuth (V8U):** `UnifiedRedirectUriServiceV8U` (`src/v8u/services/unifiedRedirectUriServiceV8U.ts`) is the single entry point for V8U flows. It uses `RedirectUriServiceV8` under the hood and adds support for **pi.flow** (redirectless).
- **MFA flows:** `MFARedirectUriServiceV8` (`src/v8/services/mfaRedirectUriServiceV8.ts`) uses **the same service**: it calls `RedirectUriServiceV8.getRedirectUriForFlow(flowType)` first, then falls back to `flowRedirectUriMapping` only when the flow is not in the V8 mapping.

Result: one service for “what redirect URI for this flow”; only the redirect URI value differs by flow type.

---

## 2. Services and Roles

### 2.1 RedirectUriServiceV8 (`src/v8/services/redirectUriServiceV8.ts`)

- **Role:** Canonical mapping of flow keys to callback **paths** and **base URL**.
- **Data:** `FLOW_REDIRECT_URI_MAPPING_V8`: flow key → `{ callbackPath, requiresRedirectUri, ... }`.
- **Base URL:** `getBaseUrl()` uses custom domain from IndexedDB/SQLite when available, then `VITE_APP_DOMAIN`, then `window.location`.
- **API:**
  - `getRedirectUriForFlow(flowKey)` → full redirect URI (`baseUrl + '/' + callbackPath`) or `''` if flow does not require a redirect.
  - `getPostLogoutRedirectUriForFlow(flowKey)`, `getRedirectUriPlaceholder`, `initializeRedirectUris`.

**V8U flow keys and callback paths (Unified OAuth):**

| Flow key           | Callback path              | Handler / note                          |
|--------------------|----------------------------|-----------------------------------------|
| `oauth-authz-v8u`  | `authz-callback`           | CallbackHandlerV8U                      |
| `implicit-v8u`     | `oauth-implicit-callback`  | ImplicitCallback → then handler         |
| `hybrid-v8u`       | `authz-callback`           | CallbackHandlerV8U                      |
| `client-credentials-v8u` | N/A (no redirect)  | —                                       |
| `device-code-v8u`  | device-callback (no browser redirect) | —                        |
| `ropc-v8u`         | N/A                        | —                                       |

**MFA flow keys:**

| Flow key          | Callback path              |
|-------------------|----------------------------|
| `unified-mfa-v8`  | `v8/unified-mfa-callback`  |
| `mfa-hub-v8`      | `mfa-hub-callback`         |

---

### 2.2 UnifiedRedirectUriServiceV8U (`src/v8u/services/unifiedRedirectUriServiceV8U.ts`)

- **Role:** Single place for **Unified OAuth** redirect URIs; only the redirect URI differs by flow type. Adds **pi.flow** (redirectless) support.
- **Uses:** `RedirectUriServiceV8.getRedirectUriForFlow(flowKey)` with flow key `{flowType}-v8u`.
- **API:**
  - `getRedirectUriForUnifiedFlow(flowType)` → default redirect URI for that flow (authz/hybrid → authz-callback, implicit → oauth-implicit-callback).
  - `getRedirectUriForAuthorize(flowType, { useRedirectless?, configuredRedirectUri? })`:
    - If `useRedirectless` (response_mode=pi.flow) → `REDIRECTLESS_URI` (`urn:pingidentity:redirectless`).
    - Else → `configuredRedirectUri` if set, else `getRedirectUriForUnifiedFlow(flowType)`.
  - `REDIRECTLESS_URI` constant for pi.flow.
  - `flowUsesRedirectUri(flowType)`, `getFlowKeyForRedirect(flowType)`.
  - Re-exports `getBaseUrl`, `getRedirectUriForFlow` from RedirectUriServiceV8.

**Consumers:** `AuthorizationUrlBuilderServiceV8U`, `UnifiedFlowIntegrationV8U`, `UnifiedFlowSteps` (and snapshot) for placeholder/fallback redirect URI.

---

### 2.3 MFARedirectUriServiceV8 (`src/v8/services/mfaRedirectUriServiceV8.ts`)

- **Role:** MFA-specific helpers (logging, validation, migration) while **using the same redirect URI source** as the rest of the app.
- **Change (2026-03):** `getRedirectUri(flowType)` now calls **`RedirectUriServiceV8.getRedirectUriForFlow(flowType)` first**. If that returns a non-empty string, that value is used. Otherwise it falls back to `generateRedirectUriForFlow(flowType)` from `flowRedirectUriMapping` for any flow types not in the V8 mapping.
- **API:** `getRedirectUri(flowType)`, `getUnifiedMFARedirectUri()`, `getV8UOAuthRedirectUri()`, `getMFAHubRedirectUri()`, `needsMigration(uri)`, `migrateCredentials(credentials, flowType)`, `logDebugEvent`, etc.

So MFA user flow redirect uses the same service as Unified OAuth: **RedirectUriServiceV8** for the actual URI; only the flow type (and thus the redirect URI) differs.

---

## 3. FlowRedirectUriMapping (legacy / fallback)

- **File:** `src/utils/flowRedirectUriMapping.ts`.
- **Role:** Broader catalog of flow types (V9, V8, V8U, MFA, etc.); used for discovery and for flows not yet in `FLOW_REDIRECT_URI_MAPPING_V8`.
- **Used by:** `MFARedirectUriServiceV8` only as **fallback** when `RedirectUriServiceV8.getRedirectUriForFlow(flowType)` returns empty. All V8/V8U and MFA flows that are in `RedirectUriServiceV8` now go through that service first.

---

## 4. pi.flow (redirectless) support

Redirectless mode is specified with the **`response_mode`** request parameter set to **`pi.flow`** (not `response_type`). See [PingOne Response mode values](https://docs.pingidentity.com/pingone/applications/p1_response_mode_values.html).

- **Request:** Include **`response_mode=pi.flow`** on the authorization request. PingOne then returns a flow object in the response instead of redirecting the browser. When authentication is complete, the app receives the auth code, access token, or ID token in a JSON response instead of a redirect.
- **redirect_uri:** When using pi.flow, this implementation may send **`urn:pingidentity:redirectless`** (`UnifiedRedirectUriServiceV8U.REDIRECTLESS_URI`) as the redirect_uri where appropriate.
- **API:** `getRedirectUriForAuthorize(flowType, { useRedirectless: true })` returns `REDIRECTLESS_URI`. When `useRedirectless` is false, the same API returns the normal flow-specific redirect URI (or user-configured override).

---

## 5. Summary of “what we did” for redirects

1. **V8U callback paths in RedirectUriServiceV8**
   - `oauth-authz-v8u` and `hybrid-v8u` → `authz-callback`.
   - `implicit-v8u` → `oauth-implicit-callback` (so ImplicitCallback runs, then forwards to the unified handler with fragment).

2. **UnifiedRedirectUriServiceV8U**
   - New single entry point for Unified OAuth redirect URIs.
   - Uses `RedirectUriServiceV8` for defaults; adds `getRedirectUriForAuthorize` with pi.flow support.

3. **Authorization and integration**
   - `AuthorizationUrlBuilderServiceV8U` and `UnifiedFlowIntegrationV8U` use `UnifiedRedirectUriServiceV8U.getRedirectUriForAuthorize()` so redirect and redirectless (pi.flow) both use the same logic.

4. **UnifiedFlowSteps**
   - Replaced hardcoded `origin/authz-callback` fallback with `getRedirectUriForUnifiedFlow(flowType)` (with final fallback to `origin/authz-callback` only if needed).

5. **MFA user flow redirect**
   - `MFARedirectUriServiceV8.getRedirectUri(flowType)` now prefers `RedirectUriServiceV8.getRedirectUriForFlow(flowType)` so MFA uses the same service and same base URL/paths as the rest of the app; fallback to `flowRedirectUriMapping` only when the flow is not in the V8 mapping.

---

## 6. Regression checks

- **Unified OAuth (authz / implicit / hybrid):** Run each flow; after PingOne redirect, callback should hit the correct path (authz-callback or oauth-implicit-callback) and the correct handler.
- **pi.flow:** Enable redirectless; authorize request must use **`response_mode=pi.flow`** (see [PingOne Response mode values](https://docs.pingidentity.com/pingone/applications/p1_response_mode_values.html)). No browser redirect for that step; PingOne returns the result in a JSON response.
- **MFA:** Run unified MFA or MFA Hub; redirect back to the app should use the URI from `RedirectUriServiceV8` (e.g. `.../v8/unified-mfa-callback` or `.../mfa-hub-callback`) and custom domain when configured.
