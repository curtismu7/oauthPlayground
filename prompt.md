# prompt.md
# Guardrails for Cursor — Do Not Invent APIs, Do Not Create Broken Flow Logic

Use these rules **for every change** you make in this project.  
These rules override Cursor’s default behavior.  
If anything is unclear, stop and leave a TODO — do *not* guess.

---

## 1. Do NOT invent API calls or endpoints
- Only use endpoints, fields, HTTP methods, and content-types that:
  - Are explicitly defined in the **PingOne official docs**, **PingOne Postman collections**, or
  - Are defined in the local spec files in this repo (`mfaflow.md`, `fido2.md`, `totp.md`, `devicePrompt.md`, etc.).
- If you cannot verify an endpoint or field from real documentation:
  - **Stop.**
  - Leave a comment like:
    ```ts
    // TODO: Endpoint or field not defined in PingOne docs/spec — requires human confirmation
    ```
  - Do **not** guess paths, JSON structures, or media types.
  - Do **not** fabricate new subpaths such as `/operations/*`, `/activate`, `/verify`, etc.

---

## 2. Do NOT create loops that can break the app
- No `while(true)` or unbounded loops.
- Every loop must have:
  - A clear maximum number of iterations, **or**
  - A clear timeout, **or**
  - A clear polling interval + max retries.
- Example (allowed):
  ```ts
  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    const status = await checkStatus();
    if (status === "COMPLETED") break;
  }
  ```
- Polling must never freeze the UI or server.

---

## 3. Do NOT produce unstable or error-prone code
- Wrap all external calls (HTTP, WebAuthn, crypto, DB, filesystem) in try/catch.
- Log errors cleanly; never crash the app.
- Always return structured, user-friendly error states.
- Never swallow errors silently.
- No floating promises — always `await` or explicitly catch.

---

## 4. Data + API Integrity
- Always follow `_links` returned by PingOne MFA APIs when performing next steps.
- Never hardcode subpaths that PingOne returns dynamically.
- Validate everything coming from user input:
  - Username
  - Environment ID
  - Worker token
  - OTP codes
  - Device IDs

---

## 5. If documentation conflicts with assumptions, the documentation wins
- If the docs disagree with existing code, update the code according to the docs.
- If the docs are unclear, preserve the current stable behavior and leave a TODO with notes — do NOT guess.

---

This file is a **hard requirement**.  
Cursor must follow these rules when modifying or generating any code in the project.
