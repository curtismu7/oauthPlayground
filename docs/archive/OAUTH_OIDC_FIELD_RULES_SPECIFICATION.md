# OAuth 2.0 & OIDC Field Rules Specification

## Purpose
Define which fields should be visible, editable, or read-only for each OAuth/OIDC flow type based on official specifications.

---

## Core Principles

1. **Hide fields that don't apply** to the flow type
2. **Show but disable fields** that have only one valid value
3. **Allow editing** for fields with multiple valid options
4. **Follow specifications exactly** - no assumptions

---

## Field Rules by Flow Type

### Authorization Code Flow (OAuth 2.0)
**Spec:** RFC 6749 Section 4.1

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ✅ Show | ✅ Yes | Any string | Required for confidential clients |
| Redirect URI | ✅ Show | ✅ Yes | Any valid URI | Required |
| Scope | ✅ Show | ✅ Yes | Space-separated list | Optional, user-defined |
| Response Type | ✅ Show | 🔒 No | `code` only | Fixed by spec |
| Grant Type | ❌ Hide | N/A | `authorization_code` | Not user-facing |
| Login Hint | ✅ Show | ✅ Yes | Any string | Optional |
| Post Logout URI | ✅ Show | ✅ Yes | Any valid URI | Optional |

**Key Points:**
- Response type MUST be `code` (RFC 6749 4.1.1)
- Requires redirect URI for callback
- Client secret required for token exchange

---

### Authorization Code Flow (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ✅ Show | ✅ Yes | Any string | Required for confidential clients |
| Redirect URI | ✅ Show | ✅ Yes | Any valid URI | Required |
| Scope | ✅ Show | 🔒 No | Must include `openid` | MUST contain openid |
| Response Type | ✅ Show | ✅ Yes | `code`, `code id_token` | User choice |
| Grant Type | ❌ Hide | N/A | `authorization_code` | Not user-facing |
| Login Hint | ✅ Show | ✅ Yes | Any string | Optional |
| Post Logout URI | ✅ Show | ✅ Yes | Any valid URI | Optional |

**Key Points:**
- Scope MUST include `openid` (OIDC Core 3.1.2.1)
- Show scope field but ensure `openid` is always present
- Response type can include `id_token` for hybrid

---

### Implicit Flow (OAuth 2.0)
**Spec:** RFC 6749 Section 4.2

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ❌ Hide | N/A | N/A | Public client - no secret |
| Redirect URI | ✅ Show | ✅ Yes | Any valid URI | Required |
| Scope | ✅ Show | ✅ Yes | Space-separated list | Optional |
| Response Type | ✅ Show | 🔒 No | `token` only | Fixed by spec |
| Grant Type | ❌ Hide | N/A | `implicit` | Not user-facing |
| Login Hint | ✅ Show | ✅ Yes | Any string | Optional |
| Post Logout URI | ✅ Show | ✅ Yes | Any valid URI | Optional |
| Client Auth Method | ✅ Show | 🔒 No | `none` only | Public client |

**Key Points:**
- Response type MUST be `token` (RFC 6749 4.2.1)
- NO client secret (public client)
- Client auth method MUST be `none`

---

### Implicit Flow (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.2

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ❌ Hide | N/A | N/A | Public client - no secret |
| Redirect URI | ✅ Show | ✅ Yes | Any valid URI | Required |
| Scope | ✅ Show | 🔒 No | Must include `openid` | MUST contain openid |
| Response Type | ✅ Show | ✅ Yes | `id_token`, `id_token token` | User choice |
| Grant Type | ❌ Hide | N/A | `implicit` | Not user-facing |
| Login Hint | ✅ Show | ✅ Yes | Any string | Optional |
| Post Logout URI | ✅ Show | ✅ Yes | Any valid URI | Optional |
| Client Auth Method | ✅ Show | 🔒 No | `none` only | Public client |

**Key Points:**
- Scope MUST include `openid` (OIDC Core 3.2.2.1)
- Response type MUST include `id_token`
- NO client secret (public client)

---

### Client Credentials Flow
**Spec:** RFC 6749 Section 4.4

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ✅ Show | ✅ Yes | Any string | Required |
| Redirect URI | ❌ Hide | N/A | N/A | No redirect in M2M |
| Scope | ❌ Hide | N/A | N/A | Uses PingOne Roles, not scopes |
| Response Type | ❌ Hide | N/A | N/A | Direct token endpoint call |
| Grant Type | ❌ Hide | N/A | `client_credentials` | Not user-facing |
| Login Hint | ❌ Hide | N/A | N/A | No user login |
| Post Logout URI | ❌ Hide | N/A | N/A | No user session |
| Client Auth Method | ✅ Show | ✅ Yes | Multiple options | User choice |

**Key Points:**
- NO redirect URI (machine-to-machine)
- NO scopes (uses PingOne Roles instead)
- NO response type (direct token call)
- Client authentication required

---

### Device Authorization Flow
**Spec:** RFC 8628

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ✅ Show | ✅ Yes | Any string | Optional (can be public) |
| Redirect URI | ❌ Hide | N/A | N/A | Uses device code flow |
| Scope | ✅ Show | ✅ Yes | Space-separated list | Optional |
| Response Type | ❌ Hide | N/A | N/A | Uses device endpoint |
| Grant Type | ❌ Hide | N/A | `urn:ietf:params:oauth:grant-type:device_code` | Not user-facing |
| Login Hint | ❌ Hide | N/A | N/A | User enters code separately |
| Post Logout URI | ❌ Hide | N/A | N/A | No direct logout |
| Client Auth Method | ✅ Show | ✅ Yes | `none`, `client_secret_*` | User choice |

**Key Points:**
- NO redirect URI (uses device code)
- Can be public or confidential client
- Uses device authorization endpoint

---

### CIBA (Client Initiated Backchannel Authentication)
**Spec:** OpenID Connect CIBA Core 1.0 (RFC 9436)

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ✅ Show | ✅ Yes | Any string | Required |
| Redirect URI | ❌ Hide | N/A | N/A | Backchannel flow |
| Scope | ✅ Show | 🔒 No | Must include `openid` | MUST contain openid |
| Response Type | ❌ Hide | N/A | N/A | Uses backchannel endpoint |
| Grant Type | ❌ Hide | N/A | `urn:openid:params:grant-type:ciba` | Not user-facing |
| Login Hint | ✅ Show | ✅ Yes | Required | User identifier |
| Post Logout URI | ❌ Hide | N/A | N/A | No direct logout |
| Client Auth Method | ✅ Show | ✅ Yes | Multiple options | User choice |

**Key Points:**
- NO redirect URI (backchannel authentication)
- Login hint REQUIRED (identifies user)
- Scope MUST include `openid`
- Uses backchannel authentication endpoint

---

### Hybrid Flow (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.3

| Field | Visibility | Editable | Valid Values | Notes |
|-------|-----------|----------|--------------|-------|
| Environment ID | ✅ Show | ✅ Yes | Any valid UUID | Required |
| Client ID | ✅ Show | ✅ Yes | Any string | Required |
| Client Secret | ✅ Show | ✅ Yes | Any string | Required |
| Redirect URI | ✅ Show | ✅ Yes | Any valid URI | Required |
| Scope | ✅ Show | 🔒 No | Must include `openid` | MUST contain openid |
| Response Type | ✅ Show | ✅ Yes | `code id_token`, `code token`, `code id_token token` | User choice |
| Grant Type | ❌ Hide | N/A | `authorization_code` | Not user-facing |
| Login Hint | ✅ Show | ✅ Yes | Any string | Optional |
| Post Logout URI | ✅ Show | ✅ Yes | Any valid URI | Optional |
| Client Auth Method | ✅ Show | ✅ Yes | Multiple options | User choice |

**Key Points:**
- Response type MUST include both `code` and `id_token` or `token`
- Scope MUST include `openid`
- Combines authorization code and implicit flows

---

## Implementation Rules

### Rule 1: Field Visibility
```typescript
if (field not applicable to flow) {
  visibility = HIDDEN
} else if (field has only one valid value) {
  visibility = VISIBLE
  editable = READ_ONLY
  showExplanation = true
} else {
  visibility = VISIBLE
  editable = EDITABLE
}
```

### Rule 2: Scope Handling for OIDC
```typescript
if (isOIDC && !scopes.includes('openid')) {
  // Auto-add openid
  scopes = 'openid ' + scopes
  // Show field as read-only with explanation
  showWarning('OIDC requires "openid" scope')
}
```

### Rule 3: Client Secret
```typescript
if (flowType === 'implicit' || 
    (flowType === 'device' && clientAuthMethod === 'none')) {
  clientSecret = HIDDEN
} else {
  clientSecret = VISIBLE
}
```

### Rule 4: Response Type
```typescript
const responseTypeRules = {
  'authorization-code-oauth': { values: ['code'], editable: false },
  'authorization-code-oidc': { values: ['code', 'code id_token'], editable: true },
  'implicit-oauth': { values: ['token'], editable: false },
  'implicit-oidc': { values: ['id_token', 'id_token token'], editable: true },
  'hybrid': { values: ['code id_token', 'code token', 'code id_token token'], editable: true },
  'client-credentials': { values: [], editable: false, hidden: true },
  'device': { values: [], editable: false, hidden: true },
  'ciba': { values: [], editable: false, hidden: true }
}
```

---

## Visual Indicators

### Read-Only Field
```
┌─────────────────────────────────────┐
│ Response Type                    🔒 │
│ ┌─────────────────────────────────┐ │
│ │ code                            │ │
│ └─────────────────────────────────┘ │
│ ℹ️ Fixed by OAuth 2.0 spec          │
└─────────────────────────────────────┘
```

### Hidden Field with Explanation
```
┌─────────────────────────────────────┐
│ ℹ️ Why is Redirect URI hidden?      │
│                                     │
│ Client Credentials is a machine-to- │
│ machine flow that doesn't use       │
│ browser redirects.                  │
└─────────────────────────────────────┘
```

### Enforced Value
```
┌─────────────────────────────────────┐
│ Scope                            🔒 │
│ ┌─────────────────────────────────┐ │
│ │ openid profile email            │ │
│ └─────────────────────────────────┘ │
│ ⚠️ OIDC requires "openid" scope     │
└─────────────────────────────────────┘
```

---

## Testing Matrix

| Flow Type | Client Secret | Redirect URI | Scope | Response Type |
|-----------|--------------|--------------|-------|---------------|
| Auth Code (OAuth) | ✅ Editable | ✅ Editable | ✅ Editable | 🔒 `code` |
| Auth Code (OIDC) | ✅ Editable | ✅ Editable | 🔒 Must have `openid` | ✅ Editable |
| Implicit (OAuth) | ❌ Hidden | ✅ Editable | ✅ Editable | 🔒 `token` |
| Implicit (OIDC) | ❌ Hidden | ✅ Editable | 🔒 Must have `openid` | ✅ Editable |
| Client Credentials | ✅ Editable | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Device | ✅ Editable | ❌ Hidden | ✅ Editable | ❌ Hidden |
| CIBA | ✅ Editable | ❌ Hidden | 🔒 Must have `openid` | ❌ Hidden |
| Hybrid | ✅ Editable | ✅ Editable | 🔒 Must have `openid` | ✅ Editable |

---

## References

- **OAuth 2.0:** RFC 6749 - https://datatracker.ietf.org/doc/html/rfc6749
- **OIDC Core:** OpenID Connect Core 1.0 - https://openid.net/specs/openid-connect-core-1_0.html
- **Device Flow:** RFC 8628 - https://datatracker.ietf.org/doc/html/rfc8628
- **CIBA:** RFC 9436 - https://datatracker.ietf.org/doc/html/rfc9436
- **PKCE:** RFC 7636 - https://datatracker.ietf.org/doc/html/rfc7636

---

## Implementation Checklist

- [ ] Create field visibility service based on flow type
- [ ] Implement read-only field component with lock icon
- [ ] Add explanatory tooltips for fixed values
- [ ] Enforce `openid` scope for OIDC flows
- [ ] Hide fields that don't apply to flow
- [ ] Add visual indicators for read-only fields
- [ ] Create "Why is this hidden?" info panels
- [ ] Test all flow types against specification
- [ ] Add unit tests for field rules
- [ ] Document field rules in user guide

---

**Document Version:** 1.0  
**Date:** 2025-11-11  
**Status:** Specification Complete - Ready for Implementation
