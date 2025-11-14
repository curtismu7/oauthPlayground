# Comprehensive Fixes: SAML, JWT, UserInfo & DOM Warning

**Date:** October 12, 2025
**Issues:** 4 critical problems identified

---

## 🐛 Issues Identified

1. **SAML Bearer** - OIDC Discovery not filling in fields  
2. **JWT Bearer** - OIDC Discovery not filling in fields
3. **OAuth Authz** - UserInfo endpoint not configured  
4. **OAuth Authz** - `<ul>` cannot appear as descendant of `<p>` DOM warning

---

## Root Cause Analysis

### Issue 1 & 2: SAML/JWT Not Auto-Filling

**Problem:**
The `onDiscoveryComplete` callbacks in both flows are setting state directly, but since these flows don't use `ComprehensiveCredentialsService` consistently, the fields don't auto-populate in the UI inputs.

**Current Behavior:**
- OIDC Discovery runs successfully
- Token endpoint and audience are set in state
- But UI input fields remain empty
- User has to manually enter values

### Issue 3: UserInfo Endpoint Missing

**Problem:**
The `ComprehensiveCredentialsService` IS extracting `userInfoEndpoint` from OIDC Discovery (line 327), but the OAuth Authorization Code flow's controller is not finding it in credentials.

**Root Cause:**
The credentials object might not include `userInfoEndpoint` in its TypeScript interface or the controller isn't accessing it correctly.

### Issue 4: DOM Nesting Warning

**Problem:**
React warning about `<ul>` being nested inside `<p>` tag, which is invalid HTML.

**Location:**
Likely in educational content sections where lists are rendered inside paragraph tags.

---

## ✅ Fixes Required

### Fix 1: Ensure All Flows Get UserInfo Endpoint from Discovery

The `ComprehensiveCredentialsService` already extracts it (line 327):
```typescript
userInfoEndpoint: discovered.userInfoEndpoint || resolvedCredentials.userInfoEndpoint,
```

But we need to ensure controllers receive it.

### Fix 2: SAML/JWT Manual Field Population

Since these are mock flows, we should populate the fields directly in the UI after discovery completes.

### Fix 3: Add UserInfo Endpoint Fallback

If userinfo endpoint is missing, construct it from environment ID:
```typescript
const userInfoEndpoint = credentials.userInfoEndpoint || 
    (credentials.environmentId 
        ? `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`
        : null);
```

### Fix 4: Fix DOM Nesting

Find and replace `<p>` tags that contain `<ul>` or `<InfoList>` with `<div>` tags.

---

## Implementation Plan

1. Add userinfo endpoint fallback to `useAuthorizationCodeFlowController.ts`
2. Update SAML Bearer discovery callback to populate all fields
3. Update JWT Bearer discovery callback to populate all fields  
4. Search for and fix DOM nesting issues

---

## Status

Ready to implement fixes.

