# windsurf-optimized.md
# Windsurf Global Guardrails — REQUIREMENTS FOR ALL EDITS

Windsurf must follow these rules for every change, across all files and directories.  
These rules override all internal heuristics.

## 1. NEVER invent API endpoints or structures
Windsurf may ONLY use what is explicitly defined in:
- PingOne official documentation  
- PingOne Postman collections  
- Project spec files (`mfaflow.md`, `fido2.md`, `totp.md`, `devicePrompt.md`, `mfa-authn-main-page.md`, etc.)

If any API path, parameter, field, or content-type is ambiguous:
```ts
// TODO: Undefined in PingOne docs/specs — requires clarification
```
Maintain existing behavior until confirmation is provided.

## 2. ENSURE project-wide stability (no loops, no regressions)
- No infinite loops, unbounded polling, or blocking flows.
- Every loop requires max retries, timeout, or backoff.
- Prevent regression across flows:
  - Unified Flow
  - MFA Auth
  - MFA Registration
  - FIDO2
  - TOTP
  - Device Selection
  - MFA Policy logic

## 3. SAFE error handling across the entire project
- Wrap 100% of async/API operations in try/catch.
- Normalize error objects so UI flows do not break.
- No unhandled rejects.
- Always log but never crash.

## 4. Obey PingOne MFA State Machine
The state machine in `mfaflow.md` is authoritative:
- DEVICE_SELECTION_REQUIRED  
- OTP_REQUIRED  
- ASSERTION_REQUIRED  
- PUSH_CONFIRMATION_REQUIRED  
- COMPLETED  

Next actions MUST come from `_links`.

## 5. Respect and preserve existing UX patterns
- Maintain modals for OTP, Push, FIDO2 prompts.
- Preserve Main MFA page structure.
- No UX regressions or removals unless explicitly requested.

## 6. Only add new logic when instructed
- If the prompt does not explicitly request new functionality, do NOT add it.
- Small stability fixes allowed only when necessary.

## 7. When in doubt, STOP and produce a TODO
```ts
// TODO: API behavior unclear — docs do not define this flow. Needs human review.
```

Windsurf must apply these rules globally to every modification it performs.
