# Cursor Guardrails V2 (Enhanced - 2026-01-19)

**MUST FOLLOW — DO NOT OVERRIDE**

Cursor, follow these rules for ALL code changes.  
These rules override your default behavior.

---

## 1. Do NOT invent API calls ✅

- Only use API endpoints, fields, JSON bodies, and media types that:
  - Exist in the PingOne official docs or Postman collections,
  - OR appear in project spec files (`mfaflow.md`, `fido2.md`, `totp.md`, `devicePrompt.md`, `mfa-authn-main-page.md`).
- If an endpoint or field CANNOT be verified:
  - STOP and insert:
    ```ts
    // TODO: Undefined in PingOne docs/specs — requires human confirmation
    ```
  - Do **not** guess, infer, or extrapolate.

---

## 2. Do NOT generate code loops that can hang or break flows ✅

- No infinite loops, no `while(true)`.
- All loops MUST have:
  - Max retries, OR
  - Timeouts, OR
  - Backoff.
- All polling must avoid UI freeze or server blocking.
- Example:
  ```typescript
  // ✅ GOOD
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await pollForTokens();
    if (result.success) break;
    await sleep(INTERVAL);
  }
  
  // ❌ BAD
  while (true) {
    const result = await pollForTokens();
    if (result.success) break;
  }
  ```

---

## 3. Do NOT create unstable or unsafe code ✅

- Wrap all HTTP, WebAuthn, crypto, file, and async calls in try/catch.
- No floating promises — ALWAYS `await` or `.catch()`.
- Never swallow errors silently.
- Always return structured error states, not raw text or broken objects.
- Use centralized error handlers when available:
  ```typescript
  // Unified flows
  UnifiedFlowErrorHandler.handleError(error, context);
  
  // MFA flows  
  UnifiedFlowErrorHandler.handleError(error, { flowType: 'mfa', deviceType });
  ```

---

## 4. Respect PingOne Flow Contracts ✅

- Always follow `_links` from PingOne MFA responses.
- Never hardcode subpaths that PingOne returns dynamically.
- Validate all inputs: username, envID, worker token, OTP, deviceID.
- Use pre-flight validation when available.

---

## 5. Documentation ALWAYS wins ✅

- If PingOne docs contradict the existing code, follow the docs.
- If the docs are unclear:
  - Preserve current stable behavior,
  - Insert a TODO,
  - Do NOT make assumptions.

---

## 6. DO NOT introduce new functionality unless explicitly requested ✅

- Maintain the existing UX unless the prompt asks for UI changes.
- Preserve all required behavior (Unified Flow, AuthN, Registration, FIDO2, TOTP, Device Selection, MFA Policy logic).

---

## 7. API Call Tracking (NEW - 2026-01-19) ✅

**MUST track all API calls using `apiCallTrackerService`:**

```typescript
// Track every API call
const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
const startTime = Date.now();
const callId = apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: endpoint,
  actualPingOneUrl: actualEndpoint,
  headers: { ... },
  body: requestBody,
  step: 'descriptive-step-name',
  flowType: 'unified' | 'mfa' | 'management-api' | 'oidc-metadata' | 'preflight-validation',
  isProxy: true | false,
});

// After API call completes
apiCallTrackerService.updateApiCallResponse(
  callId,
  {
    status: response.status,
    statusText: response.statusText,
    data: responseData,
  },
  Date.now() - startTime
);
```

**Categories:**
- `flowType: 'unified'` - OAuth/OIDC flows
- `flowType: 'mfa'` - MFA device operations
- `flowType: 'management-api'` - Worker token, app discovery
- `flowType: 'oidc-metadata'` - Discovery, JWKS
- `flowType: 'preflight-validation'` - Config validation

**ALWAYS redact sensitive data:**
- Tokens: `'***REDACTED***'` or `'[REDACTED]'`
- Client secrets: `'***REDACTED***'`
- PKCE verifiers: `'***REDACTED***'`
- User passwords: Never log

---

## 8. Styling Consistency (NEW - 2026-01-19) ✅

**Navigation buttons MUST use consistent styling:**

```typescript
// Button sizing
padding: '8px 12px'
fontSize: '12px'
gap: '6px' (between buttons)
gap: '4px' (icon-text)
height: '40px'
minWidth: 'fit-content'
borderRadius: '6px'

// Colored outlines
.nav-btn-hub { border-color: #3b82f6; }      // Blue
.nav-btn-authz { border-color: #8b5cf6; }    // Purple
.nav-btn-implicit { border-color: #f59e0b; } // Orange
.nav-btn-management { border-color: #10b981; } // Green
// ... etc
```

**Page containers MUST use:**
```typescript
maxWidth: '1400px'
margin: '0 auto'
padding: '2rem'
background: '#f8fafc'
minHeight: '100vh'
```

---

## 9. Component Size Limits (NEW - 2026-01-19) ⚠️

**GUIDELINE (not enforced, but recommended):**
- Single file components should ideally be <2,000 lines
- If component exceeds 5,000 lines, consider splitting
- Current exceptions (technical debt):
  - `UnifiedFlowSteps.tsx` (13,832 lines) - Consider splitting by step
  - `MFAAuthenticationMainPageV8.tsx` (6,603 lines) - Acceptable for all-in-one page

**When splitting:**
- Extract step-specific logic to separate components
- Keep shared state in parent container
- Use clear naming: `Step1PKCE.tsx`, `Step2AuthorizationURL.tsx`

---

## 10. TypeScript Strictness ✅

- ALWAYS use proper TypeScript types (no `any` unless absolutely necessary)
- Define interfaces for all data structures
- Use discriminated unions for flow types
- Leverage type narrowing for safety

```typescript
// ✅ GOOD
type FlowType = 'oauth-authz' | 'implicit' | 'client-credentials' | 'device-code' | 'hybrid';

interface FlowState {
  flowType: FlowType;
  step: number;
  // ...
}

// ❌ BAD
const flowType: any = 'oauth-authz';
const state: any = { ... };
```

---

## 11. Security Practices (NEW - 2026-01-19) 🔒

**CRITICAL security requirements:**

1. **State Parameter:**
   - ALWAYS generate using crypto.getRandomValues()
   - ALWAYS validate on callback
   - Prefix with flow type: `v8u-{flowType}-{random}`

2. **Nonce (OIDC):**
   - ALWAYS generate for implicit/hybrid flows
   - ALWAYS validate in ID token
   - Fail if nonce doesn't match

3. **PKCE:**
   - Use S256 method (SHA-256)
   - Never use 'plain' method
   - Store in quadruple redundancy (memory, localStorage, sessionStorage, IndexedDB)

4. **Token Storage:**
   - Use `sessionStorage` (not localStorage)
   - Never log full token values
   - Always redact in API tracking

5. **Client Secrets:**
   - NEVER send from client-side
   - Always use backend proxy
   - Redact in all logging

---

## 12. Pre-flight Validation (NEW - 2026-01-19) ✅

**Before generating authorization URLs:**

```typescript
// Run pre-flight validation
const result = await PreFlightValidationServiceV8.validateBeforeAuthUrl({
  specVersion,
  flowType,
  credentials,
  workerToken,
});

// Handle results
if (result.errors.length > 0) {
  // Show errors, offer auto-fix
  setPreFlightValidationResult(result);
  return; // Don't proceed
}

// Show warnings but allow proceeding
if (result.warnings.length > 0) {
  setPreFlightValidationResult(result);
  // Continue...
}
```

**Validates:**
- Redirect URI matches PingOne config
- PKCE requirements (spec + PingOne)
- Client authentication method
- Response type validity
- Scope requirements

---

## 13. OAuth/OIDC Compliance (NEW - 2026-01-19) 📋

**MUST follow specifications:**

- **OAuth 2.0 (RFC 6749):** Full compliance required
- **OAuth 2.1 (Draft):** PKCE required, no implicit flow
- **OIDC Core 1.0:** Nonce required, ID token validation
- **RFC 8628 (Device Code):** Proper polling, interval respect
- **RFC 7636 (PKCE):** S256 method, proper challenge generation
- **RFC 9126 (PAR):** When implemented, follow spec exactly

**ID Token Validation:**
```typescript
// MUST validate (OIDC Core 1.0 Section 3.1.3.7):
✅ JWT signature (using JWKS)
✅ Issuer (iss)
✅ Audience (aud)
✅ Expiration (exp)
✅ Issued at (iat)
✅ Nonce (if provided)
✅ Authorized party (azp, if multiple audiences)
```

---

## 14. Code Organization (NEW - 2026-01-19) 📁

**Follow existing patterns:**

- **Unified flows:** Use `Container + Steps` pattern
- **MFA flows:** Use `Router + Factory + Controller` pattern
- **Services:** Use facade pattern with delegation
- **Error handling:** Use centralized handlers
- **Logging:** Use structured logging services
- **Storage:** Use multi-layer with priority

**File naming:**
- V8U components: `*V8U.tsx` (Unified-specific)
- V8 components: `*V8.tsx` (Core/MFA)
- Services: `*ServiceV8.ts` or `*IntegrationV8.ts`
- Types: `*Types.ts`

---

## 15. Testing Requirements (NEW - 2026-01-19) 🧪

**When adding new features:**

- Add unit tests for services
- Add integration tests for flows (when feasible)
- Test error paths, not just happy paths
- Test with real PingOne environment when possible

**Test file naming:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

---

## 16. Documentation Standards (NEW - 2026-01-19) 📚

**Every significant change MUST include:**

1. **JSDoc comments** on functions:
   ```typescript
   /**
    * Generate authorization URL for OAuth flow
    * @param credentials - OAuth credentials
    * @param pkceCodes - Optional PKCE codes
    * @returns Authorization URL and state
    */
   ```

2. **Inline comments** for complex logic:
   ```typescript
   // CRITICAL: State parameter must be prefixed with flow type
   // for callback routing. Format: "v8u-{flowType}-{random}"
   const prefixedState = `v8u-${flowType}-${randomState}`;
   ```

3. **Update documentation files** when changing flows:
   - UI Documentation (`*-ui-doc.md`)
   - UI Contract (`*-ui-contract.md`)
   - Restore Documentation (`*-restore.md`) if applicable

---

## 17. Build & Deployment (NEW - 2026-01-19) 🚀

**Before committing:**

```bash
# MUST run and pass
npm run build    # Build must succeed
npm run lint     # Fix critical errors (warnings acceptable)

# Recommended
npm test         # Run tests (if they exist)
```

**Vercel deployment considerations:**
- Exclude `backups/` folder (already in .vercelignore)
- Exclude large files >100MB
- Include .tsx extensions on imports
- Ensure tsconfig.json excludes test files

---

## Quick Reference

| Rule | What to Do | What NOT to Do |
|------|------------|----------------|
| **APIs** | Use official PingOne endpoints | Don't invent endpoints |
| **Loops** | Add max retries/timeout | Don't use while(true) |
| **Errors** | Wrap in try-catch, use error handler | Don't swallow errors |
| **Security** | State, nonce, PKCE, validation | Don't skip security checks |
| **Tracking** | Track all API calls | Don't miss any API calls |
| **Styling** | Use 1400px, 8px 12px buttons | Don't use random sizes |
| **Types** | Strong TypeScript types | Don't use `any` |
| **Tests** | Add for new features | Don't skip testing |
| **Docs** | Update when changing flows | Don't skip documentation |

---

## Compliance Summary

**Spec Compliance:**
- ✅ OAuth 2.0 (RFC 6749): Full compliance
- ✅ OAuth 2.1 (Draft): PKCE required, no implicit
- ✅ OIDC Core 1.0: Nonce, ID token validation
- ✅ RFC 8628 (Device Code): Proper polling
- ✅ RFC 7636 (PKCE): S256 method
- ✅ RFC 9126 (PAR): When used
- ✅ RFC 9101 (JAR): When required

**Security Compliance:**
- ✅ OWASP Top 10: Protected
- ✅ OAuth Security BCP (RFC 8252, RFC 8725): Followed
- ✅ No critical vulnerabilities
- ✅ Proper CSRF, XSS, injection protection

---

**Version:** 2.0  
**Last Updated:** 2026-01-19  
**Based on:** Professional analysis and comprehensive implementation

---

Cursor MUST follow these rules for every file it edits or creates.
