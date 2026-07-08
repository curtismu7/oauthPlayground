# Authorization Code Flow V8 Refactor Prompt

This document contains the Cursor-ready AI prompt for simplifying `OAuthAuthorizationCodeFlowV7_2.tsx` into the new **OAuthAuthorizationCodeFlow** version. It is designed to reduce UI footprint, move educational content into popups/slideouts, and preserve full functionality of the token display.

---

## Cursor Instruction — Refactor `OAuthAuthorizationCodeFlowV7_2.tsx` into V8

You are refactoring the following file to make it radically simpler:

- `src/pages/flows/OAuthAuthorizationCodeFlowV7_2.tsx`

### Goals
- Create **OAuthAuthorizationCodeFlow.tsx** from a copy of the V7 file.
- **Do NOT change V7**.
- Dramatically **reduce footprint and complexity**.
- Move long educational sections into **popups**, **slideouts**, **collapsible** areas.
- Keep **all required config fields** accessible.
- Keep the **token display section completely intact**.

---

## 1. Versioning Requirements
- Copy `OAuthAuthorizationCodeFlowV7_2.tsx` → `OAuthAuthorizationCodeFlow.tsx`.
- Update component names and flow metadata to **V8**.
- Leave all V7 exports and registry entries untouched.

---

## 2. Untouchable Core (Must Stay Inline)
### Token Display (Sacred)
- Do **NOT** alter, reduce, remove, or collapse:
  - Access token
  - ID token
  - Refresh token
  - Copy buttons
  - Decode buttons
  - Raw JSON view
- You may wrap the token display in a neater container, but **functionality must remain untouched**.

### Required Controls
Remain inline and visible:
- environmentId
- region
- clientId
- redirectUri
- scopes
- start login / open URL button
- simulate redirect / code capture
- exchange code button
- PKCE toggle + minimal configuration

---

## 3. What Must Move Into Popups/Slideouts
Move these **out of the main UI**:

### Educational Blocks
- “Quick Start & Overview”
- “What is Authorization Code Flow?”
- “What is PKCE?”
- “What is an Authorization Request/Response?”
- Token introspection explanation
- UserInfo explanation
- Security explanations

### New Locations
- **EducationDrawer (slide-out)** for long sections.
- **InfoPopover** for 1–3 sentence tooltips.
- **Collapsible `<details>`** for medium sections.

Use triggers such as:
- `?` icons
- “Learn More” links
- “Help” buttons

---

## 4. Step Structure Simplification
Reduce steps to:
1. Configure app & environment
2. Build authorization request
3. Sign in & capture authorization code
4. Exchange for tokens (token display lives here)

### Post-token optional exploration
Move introspection, userinfo, security into collapsibles:
```
<details>
  <summary>🔍 Introspect token</summary>
  ...
</details>

<details>
  <summary>👤 UserInfo</summary>
  ...
</details>

<details>
  <summary>🛡 Security Notes</summary>
  ...
</details>
```

---

## 5. Field/UI Reduction Rules
### Inline fields
- environmentId
- region
- clientId
- redirectUri
- scopes
- PKCE toggle

### Move to “Advanced” collapsible
- clientSecret
- logout URIs
- alternate redirect URIs
- specialty PingOne flags

### Remove or condense
- Giant explanatory InfoBoxes
- Multi-card credential blocks

---

## 6. Architecture Rules
Split into:

### A. Core logic module (no JSX)
Handles:
- loadCredentials
- saveCredentials
- workerToken caching
- token reuse

### B. Lightweight UI components
- `CredentialsManagerButton`
- `CredentialsModal`
- `InfoPopover`
- `EducationDrawer`

Flows will call:
```ts
await ensureCredentials();
```
and UI appears **only if required**.

---

## 7. Guardrails
You must NOT:
- Break credential retrieval
- Reduce educational clarity
- Remove token display functionality
- Add heavyweight dependencies

You MAY:
- Reorganize JSX
- Move education out of the way
- Collapse steps
- Create small helper components

---

## 8. Final State Definition
When complete:
- `OAuthAuthorizationCodeFlow.tsx` is **dramatically smaller**.
- Screen real estate is minimal and uncluttered.
- Credential UI is a **modal**, not a giant inline section.
- Education is **on-demand**, not forced inline.
- Token display remains fully intact and rich.

---

This document will be updated as we refine the V8 spec.
