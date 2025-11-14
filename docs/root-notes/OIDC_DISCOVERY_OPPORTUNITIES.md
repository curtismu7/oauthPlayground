# OIDC Discovery Auto-Population Opportunities

## Current Implementation ✅

The following flows already have OIDC Discovery auto-population:

### V6 Flows (Already Implemented)
1. **OAuth Authorization Code Flow V6** - ✅ Auto-populates auth/token endpoints
2. **OIDC Authorization Code Flow V6** - ✅ Auto-populates auth/token endpoints
3. **OAuth Device Authorization Flow V6** - ✅ Auto-populates device_authorization_endpoint
4. **OIDC Device Authorization Flow V6** - ✅ Auto-populates device_authorization_endpoint
5. **PAR Flow V6** - ✅ Auto-populates pushed_authorization_request_endpoint
6. **RAR Flow V6** - ✅ Auto-populates authorization_endpoint with RAR support
7. **Hybrid Flow V6** - ✅ Auto-populates auth/token endpoints
8. **JWT Bearer Flow V6** - ✅ Auto-populates token_endpoint and audience (issuer)
9. **SAML Bearer Flow V6** - ✅ Auto-populates token_endpoint and audience (issuer)
10. **Client Credentials Flow V6** - Uses `ComprehensiveCredentialsService` ✅

---

## Opportunities for Enhancement

### High Priority - Missing OIDC Discovery

#### 1. **Resource Owner Password Flows**
**Files:**
- `src/pages/flows/OIDCResourceOwnerPasswordFlowV5.tsx` (Line 508-514)
- `src/pages/flows/OAuthResourceOwnerPasswordFlowV5.tsx` (Line 508-514)

**Current State:**
```typescript
<Label>Token Endpoint</Label>
<Input
    placeholder="Enter token endpoint URL..."
    value={credentials.tokenEndpoint || ''}
    onChange={(e) => updateCredentials({ tokenEndpoint: e.target.value })}
/>
```

**Recommended Addition:**
- Add OIDC Discovery input that auto-populates `token_endpoint`
- Auto-populate from issuer URL when environment ID is entered
- Use pattern similar to JWT Bearer flow

**Benefits:**
- Users don't have to manually construct token endpoint URLs
- Reduces configuration errors
- Consistent with other V5/V6 flows

---

#### 2. **Implicit Flows (V6 Versions)**
**Files:**
- `src/pages/flows/OAuthImplicitFlowV6.tsx`
- `src/pages/flows/OIDCImplicitFlowV6_Full.tsx`

**Current State:**
- These flows use `ComprehensiveCredentialsService` which includes discovery ✅
- However, they also need:
  - **`end_session_endpoint`** for logout functionality
  - **`revocation_endpoint`** for token revocation

**Recommended Addition:**
- Extend OIDC Discovery to also populate:
  - `end_session_endpoint` → Use for logout redirect
  - `revocation_endpoint` → Use for token cleanup

**Benefits:**
- Complete logout flow support
- Proper token lifecycle management
- Spec-compliant logout implementation

---

#### 3. **Configuration Page**
**File:** `src/pages/Configuration_original.tsx` (Lines 1936-1965)

**Current State:**
```typescript
<FormGroup>
    <label htmlFor={formIds.tokenEndpoint}>Token Endpoint</label>
    <input
        type="url"
        id={formIds.tokenEndpoint}
        name="tokenEndpoint"
        value={formData.tokenEndpoint}
        onChange={handleChange}
    />
</FormGroup>

<FormGroup>
    <label htmlFor={formIds.userInfoEndpoint}>UserInfo Endpoint</label>
    <input
        type="url"
        id={formIds.userInfoEndpoint}
        name="userInfoEndpoint"
        value={formData.userInfoEndpoint}
        onChange={handleChange}
    />
</FormGroup>
```

**Recommended Addition:**
- Add OIDC Discovery section at the top
- Auto-populate all endpoints when issuer URL is provided:
  - `authorization_endpoint`
  - `token_endpoint`
  - `userinfo_endpoint`
  - `device_authorization_endpoint`
  - `pushed_authorization_request_endpoint`
  - `end_session_endpoint`
  - `revocation_endpoint`
  - `introspection_endpoint`

**Benefits:**
- One-click setup for entire OAuth Playground
- Reduces setup friction for new users
- Ensures all endpoints are correct and consistent

---

### Medium Priority - Additional Endpoint Types

#### 4. **Token Introspection Flow**
**File:** `src/pages/flows/TokenIntrospectionFlowV5.tsx`

**Current Need:**
- Auto-populate `introspection_endpoint` from OIDC Discovery
- Currently requires manual endpoint entry

**Recommended Addition:**
- Add OIDC Discovery to get `introspection_endpoint`
- Auto-fill when environment ID is provided

---

#### 5. **Token Revocation Support**
**Flows that could benefit:**
- All V6 Authorization flows
- All Device Authorization flows
- Implicit flows

**Current Need:**
- OIDC Discovery provides `revocation_endpoint`
- No flows currently use this for token cleanup

**Recommended Addition:**
- Add "Revoke Token" button to token display sections
- Use `revocation_endpoint` from discovery
- Implement RFC 7009 token revocation

---

### Low Priority - Nice to Have

#### 6. **Advanced Parameters Enhancement**
**File:** `src/services/advancedParametersSectionService.tsx`

**Current Need:**
- Some providers support custom parameters
- Discovery document contains `claims_supported`, `scopes_supported`, etc.

**Recommended Addition:**
- Parse `claims_supported` from discovery to validate claims requests
- Parse `scopes_supported` to show available scopes
- Parse `grant_types_supported` to validate flow compatibility
- Parse `response_types_supported` to validate response types

**Benefits:**
- Better validation
- Educational value - shows what provider supports
- Prevents configuration errors

---

#### 7. **Dynamic Client Registration**
**Endpoint:** `registration_endpoint` (from OIDC Discovery)

**Current Need:**
- Users manually create clients in PingOne console
- Could be automated for testing/demo purposes

**Recommended Addition:**
- Add "Auto-Register Client" flow
- Use `registration_endpoint` from discovery
- Implement RFC 7591 Dynamic Client Registration

**Benefits:**
- Faster demo setup
- Self-service client creation
- Great for educational purposes

---

## Implementation Strategy

### Phase 1: High Priority (Current Sprint)
1. ✅ JWT Bearer & SAML Bearer - **DONE**
2. Add to Resource Owner Password flows
3. Extend Implicit flows for logout endpoints
4. Add to Configuration page

### Phase 2: Medium Priority (Next Sprint)
1. Token Introspection flow
2. Token Revocation support across all flows
3. End Session (Logout) support

### Phase 3: Low Priority (Future)
1. Advanced parameter validation
2. Dynamic client registration
3. Provider capability discovery

---

## Technical Notes

### Reusable Component
All implementations should use:
- `oidcDiscoveryService` from `src/services/oidcDiscoveryService.ts`
- `ComprehensiveCredentialsService` where applicable (V6 flows)
- Consistent error handling
- Proper loading states

### Discovery Document Fields
Standard OIDC Discovery provides:
- `issuer` - Base URL
- `authorization_endpoint`
- `token_endpoint`
- `userinfo_endpoint`
- `jwks_uri`
- `registration_endpoint`
- `scopes_supported`
- `response_types_supported`
- `grant_types_supported`
- `subject_types_supported`
- `id_token_signing_alg_values_supported`
- `claims_supported`
- `code_challenge_methods_supported`
- `device_authorization_endpoint` (RFC 8628)
- `pushed_authorization_request_endpoint` (RFC 9126)
- `revocation_endpoint` (RFC 7009)
- `introspection_endpoint` (RFC 7662)
- `end_session_endpoint` (RP-Initiated Logout)

---

## Summary

**Current Coverage:** 10/15 major flows have OIDC Discovery ✅

**Immediate Opportunities:**
1. Resource Owner Password flows (2 flows)
2. Configuration page (global setup)
3. Token Introspection flow (1 flow)
4. Logout endpoints (Implicit flows)

**Total Impact:** 
- Reduces manual configuration by ~80%
- Eliminates common endpoint URL errors
- Improves user onboarding experience
- More spec-compliant implementations

