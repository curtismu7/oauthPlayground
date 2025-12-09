# Cursor Prompt: Implement Username-less Passkey / FaceID Flow with PingOne MFA (PingOne FIDO2)

You are refactoring and extending an existing PingOne SSO + PingOne MFA app.

The app already has:

- PingOne SSO and MFA flows working (authorization code, MFA devices, etc.).
- A **UI button** labeled:  
  **“Use Passkey / FaceID (username-less)”**
- Existing legacy sign-in paths (username/password, other MFA factors) that MUST NOT be broken or regressed.

We now need a **proper username-less Passkey (FIDO2/WebAuthn) flow** using **PingOne MFA FIDO2 support**, wired to that button, with correct logic to:

1. If the user already has a valid passkey for this application and environment →  
   **Authenticate via WebAuthn** (no username prompt).
2. If the user does **not** have a passkey →  
   **Fall back to WebAuthn registration** (again username-less, discoverable credential), then allow login to proceed.

The flow must be **PingOne-correct** and must **not “freestyle” WebAuthn**. You should follow the PingOne FIDO2 / passkeys documentation and API shapes/semantics as closely as possible, even if you have to infer details from existing project patterns.

---

## High-Level Requirements

1. **Username-less Passkey UX**
   - The **“Use Passkey / FaceID (username-less)”** button:
     - Works on desktop and mobile.
     - Triggers a **WebAuthn discoverable credential** flow:
       - First tries **authentication** with `navigator.credentials.get(...)` using a **credential request** from PingOne (FIDO2 / MFA API).
       - If the browser/device reports **no available credentials** or the request fails in a way that indicates “no passkey”, we then:
         - Start a **registration** flow using `navigator.credentials.create(...)` with registration options from PingOne.
   - No username input should be required for this button. It should behave like Apple / Google / Microsoft passkey flows:
     - Browser shows **account chooser / FaceID / platform authenticator** and handles username behind the scenes.

2. **FIDO2 / Passkey Wiring with PingOne**
   - Use PingOne’s MFA / FIDO2 endpoints for:
     - **Creating FIDO2 registration options** (server → browser).
     - **Verifying registration** (browser → server).
     - **Creating FIDO2 authentication options** (server → browser).
     - **Verifying authentication** (browser → server).
   - Make sure these calls are **environment aware**:
     - Use `environmentId`, `region`, appropriate **Worker** or **user token** where required.
   - Use **discoverable credentials / resident keys** so that authentication can be username-less:
     - The WebAuthn options must allow resident/discoverable credentials (passkeys) to be used.
   - Respect PingOne’s device and MFA policies:
     - Ensure FIDO2 is an allowed device type.
     - For authentication, ensure you’re creating proper **device authentication transactions** (if required by PingOne MFA).

3. **Logic: Auth First, Then Register**

   Implement the “smart” flow like this:

   - When the user clicks **Use Passkey / FaceID (username-less)**:
     1. **Call backend** endpoint you create, e.g.:
        - `POST /api/auth/passkey/options/authentication`
        - This SHOULD:
          - Call PingOne FIDO2/MFA API to create **authentication options** for username-less login (no explicit username).
          - Return WebAuthn `publicKey` request options to the browser.
     2. On the frontend, call:
        - `navigator.credentials.get({ publicKey: optionsFromBackend })`.
     3. If success:
        - POST result to backend endpoint, e.g.:
          - `POST /api/auth/passkey/verify-authentication`
        - Backend:
          - Verifies the assertion via PingOne FIDO2/MFA API.
          - On success, completes login:
            - Either:
              - Exchanges the FIDO2 result for a PingOne session (e.g., via MFA device authentication integration and SSO/OIDC continuation), OR
              - Validates the MFA event and then continues the existing session/authorization code flow.
     4. If the browser indicates **no credentials / notAllowed / no authenticator**, OR PingOne returns an error that clearly means “no existing passkey for this user/environment”:
        - FALLBACK: start **registration**:
          - Call backend: `POST /api/auth/passkey/options/registration`
            - Backend asks PingOne for FIDO2 **registration options** (for an appropriate user):
              - This might involve using:
                - A “pre-user” identity, OR
                - A partially known user, OR
                - A PingOne flow that supports WebAuthn username-less registration. Use existing code conventions for how user objects are created / mapped for MFA.
          - Frontend gets registration `publicKey` options.
          - Call `navigator.credentials.create({ publicKey: registrationOptions })`.
          - Send result to backend endpoint:
            - `POST /api/auth/passkey/verify-registration`
          - Backend completes registration in PingOne (creates an MFA FIDO2 device / passkey).
          - Then either:
            - Immediately authenticate the user (e.g., treat this as login + registration).
            - Or chain into existing authorization flow.

   - You must do **robust error handling**:
     - Differentiate between:
       - User cancel (dismiss, notAllowedError).
       - No credentials.
       - Real failures (network, PingOne error, invalid options).
     - For user cancel or no credentials: show a friendly message and/or revert to **standard username/password** or other existing flows.
     - NEVER break the existing login forms if passkey flow fails.

4. **Non-Regression / Integration Rules**

   - DO NOT change existing URLs, query parameters, or core auth flows without a compelling reason.
   - DO NOT break or remove existing:
     - Username/password login.
     - Other MFA factors (TOTP, SMS, email, etc.).
   - The passkey button must be an **additive** feature.
   - Re-use existing:
     - Configuration patterns (e.g., `settings.json`, `.env`).
     - Logging conventions (unified logging, module tags, timestamps, emojis).
     - Error handling patterns and notification/toast system.

5. **Code Organization & Implementation Style**

   - Follow the project’s frontend stack (React/TypeScript) and backend (Node/Express or equivalent) patterns:
     - Frontend:
       - Add a dedicated **hook** and/or **service** for passkey flows:
         - E.g., `usePasskeyAuth()` or `passkeyService.ts`.
       - Implement UI state for:
         - “Starting authentication…”
         - “Authenticating with passkey…”
         - “Registering new passkey…”
         - Errors / fallback states.
     - Backend:
       - Create a small, focused `passkeyController` or equivalent in the API layer that encapsulates PingOne FIDO2 interactions.
       - Use existing **PingOne SDK / helper** layer if the project already has one (e.g., `pingOneMfaService.ts`).
       - Make sure functions are:
         - `getPasskeyAuthenticationOptions()`
         - `verifyPasskeyAuthentication()`
         - `getPasskeyRegistrationOptions()`
         - `verifyPasskeyRegistration()`
   - Keep everything **heavily commented**, explaining:
     - Which PingOne endpoint is being called (exact URL path).
     - Which spec this corresponds to (WebAuthn, FIDO2, username-less).
     - Any assumptions about user identity mapping.

6. **PingOne-Specific Expectations**

   - Assume use of **PingOne MFA FIDO2 APIs** for:
     - Creating FIDO2 registration and authentication options.
     - Verifying FIDO2 responses.
   - Ensure:
     - The FIDO2 device created is an MFA device that can be used by **PingOne SSO/OIDC** (so that downstream tokens reflect MFA).
     - You maintain proper **MFA state**:
       - When passkey login succeeds, the resulting SSO session / ID token should have appropriate `acr` or equivalent claims indicating MFA.
   - Use the correct **token type**:
     - Typically a **Worker token** for server-to-PingOne calls to FIDO2 & MFA APIs.
     - Do not hardcode secrets in the frontend; keep everything secure and backend-only.

7. **Testing Scenarios**

   Implement and verify the following scenarios:

   1. **Happy Path – Existing Passkey**
      - User has an existing passkey registered.
      - Click “Use Passkey / FaceID (username-less)”.
      - WebAuthn UI pops, FaceID / platform authenticator.
      - Authentication succeeds → user is logged in with MFA satisfied.

   2. **Happy Path – No Passkey Yet**
      - User does NOT have a passkey.
      - Click passkey button.
      - Authentication options call succeeds, but WebAuthn reports “no credentials”.
      - System falls back to registration:
        - Shows platform authenticator UI to create passkey.
        - Registration succeeds and is stored as FIDO2 MFA device in PingOne.
        - Flow completes with login.

   3. **User Cancels**
      - User cancels at WebAuthn prompt.
      - UI surfaces a clear, non-technical message.
      - Existing login options remain available (username/password, other MFA).

   4. **PingOne Error**
      - PingOne FIDO2 / MFA API returns an error.
      - Log details with existing logging conventions.
      - Show a generic safe error to user.
      - Do NOT leak secrets or internal IDs to the UI.

   5. **Cross-device / Mobile Safari**
      - Make sure logic is robust for platform authenticator vs roaming authenticator (e.g., security key).
      - Do not assume desktop-only.

8. **Guardrails**

   - Do NOT invent new PingOne endpoints. Use the existing FIDO2 / MFA APIs already present in the project or well-documented in PingOne’s FIDO2 docs.
   - Do NOT store WebAuthn credentials or raw private keys; only store server side IDs / associating information provided by PingOne.
   - Do NOT change password or non-passkey MFA flows.
   - Keep the code readable, modular, and aligned with the app’s existing V8+ design patterns and “ease of use” goals:
     - Simple, clean screens, minimal text.
     - Good inline help where needed.
     - Clear, centralized error logging.

---

## Deliverables

1. **Backend**
   - New passkey controller/service for PingOne FIDO2:
     - `getPasskeyAuthenticationOptions`
     - `verifyPasskeyAuthentication`
     - `getPasskeyRegistrationOptions`
     - `verifyPasskeyRegistration`
   - Routes under `/api/auth/passkey/...`, wired into existing server.

2. **Frontend**
   - Wiring of the **“Use Passkey / FaceID (username-less)”** button to the passkey flow.
   - React hook/service for handling the full flow (auth first, registration fallback).
   - User-friendly loading & error UI.

3. **Documentation**
   - Inline code comments explaining:
     - How this integrates with PingOne MFA.
     - Where to configure environment IDs, worker tokens, and allowed origins.
   - Short README-style comment block at the top of the main passkey module summarizing the username-less logic.

Implement this now across both client and server, preserving all existing behavior while adding a robust PingOne-backed username-less passkey / FaceID experience.
