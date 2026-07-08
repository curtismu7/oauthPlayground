# Authorization Code V8 Implementation Plan
**Date:** 2024-11-16  
**Focus:** Authorization Code V8 as template for all future V8 conversions  
**Goal:** Build reusable services that both V8 flows can use

---

## Current Status Summary

### ✅ Completed Today
- Fixed V8 flow linting (duplicate props, unused variables, type assertions)
- Added app picker to test pages with worker token integration
- Created dedicated test callback page (no deprecation warnings)
- Ensured `openid` scope always included in test pages
- Identified service linting issues (14 errors, 136 warnings)

### 🎯 Focus Areas (From Gap Analysis)

Based on `# NEW V8 FUNCTIONALITY GAP ANALYSIS.md`, focusing on Authorization Code V8:

| # | Feature | Baseline | V8 | Status | Priority |
|---|---------|----------|----|---------|----|
| 1 | OIDC Discovery | ✅ | ✅ | **Needs V8 Pattern** | HIGH |
| 2 | Token Display (access, ID, refresh) | ✅ | ✅ | **Needs Enhancement** | HIGH |
| 3 | ID Token visibility (OIDC only) | ✅ | ✅ | **Verify** | MEDIUM |
| 4 | Refresh Token display & decode | ✅ | ✅ | **Needs Enhancement** | HIGH |
| 5 | Raw token response viewer | ✅ | ✅ | **Verify** | MEDIUM |
| 6 | offline_access scope handling | ✅ | ⚠️ | **Missing Education** | HIGH |
| 7 | PAR support for OIDC flows | ✅ | ❌ | **Missing** | MEDIUM |
| 8 | RAR support | ✅ | ❌ | **Missing** | LOW |
| 9 | Worker token integration | ✅ | ✅ | **OK** | - |
| 10 | Config checker vs PingOne | ✅ | ⚠️ | **Needs V8 Pattern** | HIGH |
| 11 | Credential management | ✅ | ✅ | **Needs V8 Pattern** | HIGH |
| 12 | Redirect-less mode | ✅ | ✅ | **Verify** | MEDIUM |
| 13 | MFA/Verify education | ⚠️ | ⚠️ | **Future** | LOW |
| 14 | Version badge consistency | ✅ | ✅ | **OK** | - |
| 15 | Logging & UI filtering | ✅ | ⚠️ | **Needs Enhancement** | MEDIUM |

---

## Phase 1: High Priority - Token & Scope UX (CURRENT)

### 1.1 Token Display Service (Reusable)
**Goal:** Unified token display component for all V8 flows

**Current State:**
- `UnifiedTokenDisplayService` exists but has React hook errors (FIXED)
- Token display works but needs V8 pattern enhancements

**Actions:**
- [ ] Create `TokenDisplay` component with:
  - Copy button for each token
  - Decode in-place (collapsible JSON view)
  - Syntax-highlighted JSON
  - Educational tooltips
  - "Send to Token Management" button
- [ ] Only show ID token for OIDC flows
- [ ] Add refresh token display with same treatment
- [ ] Add module-tagged logging: `[🧪 TOKEN-DISPLAY-V8]`

**Files to Create/Modify:**
- `src/components/v8/TokenDisplay.tsx` (new)
- `src/services/tokenDisplayService.ts` (new)
- Update `OAuthAuthorizationCodeFlow.tsx` to use new component

---

### 1.2 offline_access Scope Education
**Goal:** Explain why offline_access matters

**Current State:**
- Scope can be added but no explanation
- Users don't understand refresh token implications

**Actions:**
- [ ] Add scope education modal/tooltip
- [ ] Show when offline_access is selected:
  - "This scope requests a refresh token"
  - "Refresh tokens allow long-lived access without re-authentication"
  - "Required for: background sync, offline access, long sessions"
- [ ] Add visual indicator when offline_access is present
- [ ] Add logging: `[🔑 SCOPE-EDUCATION-V8]`

**Files to Create/Modify:**
- `src/components/v8/ScopeEducationTooltip.tsx` (new)
- Update `ComprehensiveCredentialsService.tsx` to integrate

---

### 1.3 Config Checker V8 Pattern
**Goal:** Modal that compares user config vs PingOne app config

**Current State:**
- Config checker exists but not V8-styled
- Not integrated into V8 flow UI

**Actions:**
- [ ] Create `ConfigCheckerModal` component
- [ ] Show comparison table:
  - Client ID ✓/✗
  - Redirect URIs ✓/✗
  - Grant Types ✓/✗
  - Scopes ✓/✗
  - PKCE enforcement ✓/✗
- [ ] Add "Fix in PingOne" guidance
- [ ] Add logging: `[🔍 CONFIG-CHECKER-V8]`

**Files to Create/Modify:**
- `src/components/v8/ConfigCheckerModal.tsx` (new)
- `src/services/configCheckerService.ts` (new)
- Update `OAuthAuthorizationCodeFlow.tsx` to add button

---

## Phase 2: Medium Priority - Discovery & Credentials

### 2.1 OIDC Discovery V8 Pattern
**Goal:** Pop-up/slide-out for discovery with education

**Current State:**
- Discovery works but UI is inline
- Not following V8 pop-up pattern

**Actions:**
- [ ] Create `DiscoveryModal` component
- [ ] Show discovered endpoints with explanations
- [ ] Add "What is OIDC Discovery?" education
- [ ] Add logging: `[📡 DISCOVERY-V8]`

**Files to Create/Modify:**
- `src/components/v8/DiscoveryModal.tsx` (new)
- Update `ComprehensiveCredentialsService.tsx`

---

### 2.2 Credential Management V8 Pattern
**Goal:** Simplified credential UI with pop-ups

**Current State:**
- `ComprehensiveCredentialsService` exists
- UI is complex, not fully V8-styled

**Actions:**
- [ ] Refactor to use pop-ups for:
  - Basic credentials (env, client ID, secret)
  - Advanced options (JWKS, private key, custom params)
  - Discovery settings
- [ ] Add progressive disclosure
- [ ] Add logging: `[🗝️ CREDENTIAL-MANAGER-V8]`

**Files to Modify:**
- `src/services/comprehensiveCredentialsService.tsx`

---

## Phase 3: Lower Priority - Advanced Features

### 3.1 PAR Support
**Goal:** Pushed Authorization Requests for OIDC flows

**Actions:**
- [ ] Add PAR toggle in advanced options
- [ ] Show PAR request/response
- [ ] Add education about PAR benefits
- [ ] Add logging: `[🔐 PAR-V8]`

---

### 3.2 RAR Support
**Goal:** Rich Authorization Requests

**Actions:**
- [ ] Add RAR JSON builder
- [ ] Provide sample templates
- [ ] Add validation
- [ ] Add logging: `[📋 RAR-V8]`

---

## Implementation Guidelines

### V8 Design Pattern (from authz8.md)
1. **Single main section** - One primary control panel
2. **Pop-ups & Slide-outs** - For credentials, advanced options, discovery
3. **Education by default** - Plain language + expandable details
4. **Beginner vs Expert** - Basic mode with sane defaults, advanced mode with full control

### Logging Standards
Every component must use:
```typescript
console.log('[🧠 MODULE-NAME-V8] Message', { context });
```

Module tags:
- `[🧪 TOKEN-DISPLAY-V8]` - Token display
- `[🔑 SCOPE-EDUCATION-V8]` - Scope education
- `[🔍 CONFIG-CHECKER-V8]` - Config checker
- `[📡 DISCOVERY-V8]` - OIDC discovery
- `[🗝️ CREDENTIAL-MANAGER-V8]` - Credentials
- `[🔐 PAR-V8]` - PAR support
- `[📋 RAR-V8]` - RAR support

### Flow-Safe-Change Rules
- Add, don't randomly mutate
- Preserve existing APIs where possible
- Add tests for new functionality
- Tag critical code with comments:
  ```typescript
  // V8_HARDENED: Critical behavior - test before changing
  // FLOW_SAFE_CHANGE: Do not modify without updating tests
  ```

---

## Next Steps

1. **Start with Token Display V8** (highest impact, most reusable)
2. **Add offline_access education** (quick win, high value)
3. **Build Config Checker Modal** (safety feature)
4. **Refactor Discovery & Credentials** (UX improvement)
5. **Add PAR/RAR** (advanced features)

---

## Success Criteria

- [ ] All high-priority items completed
- [ ] Reusable components work in both Authz V8 and Implicit V8
- [ ] No regressions in existing functionality
- [ ] All new code has module-tagged logging
- [ ] Documentation updated
- [ ] Ready to use as template for Device Code, Client Credentials, etc.
