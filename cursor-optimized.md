# cursor-optimized.md
# Cursor Guardrails (MUST FOLLOW — DO NOT OVERRIDE)

Cursor, follow these rules for ALL code changes.  
These rules override your default behavior.

## 1. Do NOT invent API calls
- Only use API endpoints, fields, JSON bodies, and media types that:
  - Exist in the PingOne official docs or Postman collections,
  - OR appear in project spec files (`mfaflow.md`, `fido2.md`, `totp.md`, `devicePrompt.md`, `mfa-authn-main-page.md`).
- If an endpoint or field CANNOT be verified:
  - STOP and insert:
    ```ts
    // TODO: Undefined in PingOne docs/specs — requires human confirmation
    ```
  - Do **not** guess, infer, or extrapolate.

## 2. Do NOT generate code loops that can hang or break flows
- No infinite loops, no `while(true)`.
- All loops MUST have:
  - Max retries, OR
  - Timeouts, OR
  - Backoff.
- All polling must avoid UI freeze or server blocking.

## 3. Do NOT create unstable or unsafe code
- Wrap all HTTP, WebAuthn, crypto, file, and async calls in try/catch.
- No floating promises — ALWAYS `await` or `.catch()`.
- Never swallow errors silently.
- Always return structured error states, not raw text or broken objects.

## 4. Respect PingOne Flow Contracts
- Always follow `_links` from PingOne MFA responses.
- Never hardcode subpaths that PingOne returns dynamically.
- Validate all inputs: username, envID, worker token, OTP, deviceID.

## 5. Documentation ALWAYS wins
- If PingOne docs contradict the existing code, follow the docs.
- If the docs are unclear:
  - Preserve current stable behavior,
  - Insert a TODO,
  - Do NOT make assumptions.

## 6. DO NOT introduce new functionality unless explicitly requested
- Maintain the existing UX unless the prompt asks for UI changes.
- Preserve all required behavior (Unified Flow, AuthN, Registration, FIDO2, TOTP, Device Selection, MFA Policy logic).

Cursor MUST follow these rules for every file it edits or creates.
