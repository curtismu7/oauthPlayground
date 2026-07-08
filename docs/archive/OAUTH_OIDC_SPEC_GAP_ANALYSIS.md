# OAuth 2.0 / OIDC Spec Compliance Gap Analysis

**Date:** 2024-11-22  
**Purpose:** Identify missing OAuth/OIDC parameters that should be taught for full spec compliance while matching PingOne capabilities

---

## ✅ Currently Implemented

### Core Parameters
- ✅ `client_id` - Client identifier
- ✅ `client_secret` - Client secret (confidential clients)
- ✅ `redirect_uri` - Callback URL
- ✅ `response_type` - Authorization response type (code, token, id_token, etc.)
- ✅ `response_mode` - How response is returned (query, fragment, form_post, pi.flow) **NEW**
- ✅ `scope` - Requested permissions
- ✅ `state` - CSRF protection token
- ✅ `nonce` - Replay attack protection (OIDC)
- ✅ `code_challenge` / `code_challenge_method` - PKCE
- ✅ `code_verifier` - PKCE verification
- ✅ `grant_type` - Token endpoint grant type
- ✅ `prompt` - User interaction control (none, login, consent)

### Advanced Features
- ✅ PAR (Pushed Authorization Requests) - `request_uri`
- ✅ Token introspection
- ✅ Token revocation
- ✅ UserInfo endpoint
- ✅ OIDC Discovery
- ✅ JWKS (JSON Web Key Sets)
- ✅ JWT validation and decoding
- ✅ Refresh tokens
- ✅ MFA/TOTP support
- ✅ Device Authorization Flow
- ✅ Client Credentials Flow
- ✅ Token Exchange

---

## ❌ Missing OAuth/OIDC Parameters (Should Add)

### 1. `display` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1.2.1  
**Values:** `page`, `popup`, `touch`, `wap`  
**Purpose:** Controls how authentication UI is displayed  
**PingOne Support:** ✅ Supported  
**Priority:** 🟡 Medium

**Why Add:**
- Useful for mobile apps (`touch`)
- Useful for embedded auth (`popup`)
- Teaches UI/UX considerations in OAuth flows

**Implementation:**
```typescript
display?: 'page' | 'popup' | 'touch' | 'wap';
```

**Education:**
- `page` (default) - Full page redirect
- `popup` - Popup window (for embedded auth)
- `touch` - Touch-optimized interface (mobile)
- `wap` - WAP-optimized interface (legacy mobile)

---

### 2. `max_age` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1.2.1  
**Type:** Number (seconds)  
**Purpose:** Maximum authentication age - forces re-authentication if session is older  
**PingOne Support:** ✅ Supported  
**Priority:** 🟢 High

**Why Add:**
- Critical for security-sensitive operations
- Teaches session management concepts
- Common in banking/financial apps

**Implementation:**
```typescript
max_age?: number; // seconds since last authentication
```

**Education:**
- Forces fresh authentication if user session is too old
- Example: `max_age=300` requires auth within last 5 minutes
- Useful for high-security operations (money transfers, etc.)
- Server returns `auth_time` claim in ID token for verification

---

### 3. `login_hint` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1.2.1  
**Type:** String  
**Purpose:** Pre-fill username/email in login form  
**PingOne Support:** ✅ Supported  
**Priority:** 🟢 High

**Why Add:**
- Improves UX significantly
- Common in real-world implementations
- Easy to implement and understand

**Implementation:**
```typescript
login_hint?: string; // email or username
```

**Education:**
- Pre-fills login form with known email/username
- Example: `login_hint=user@example.com`
- Improves UX when you know who's logging in
- User can still change it

---

### 4. `id_token_hint` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1.2.1  
**Type:** String (JWT)  
**Purpose:** Pass previous ID token to hint at user identity  
**PingOne Support:** ✅ Supported  
**Priority:** 🟡 Medium

**Why Add:**
- Used with `prompt=none` for silent authentication
- Teaches token reuse patterns
- Important for SSO scenarios

**Implementation:**
```typescript
id_token_hint?: string; // Previous ID token (JWT)
```

**Education:**
- Pass previous ID token to hint at user identity
- Often used with `prompt=none` for silent re-auth
- Useful for SSO and session management
- Server can validate and skip login if session valid

---

### 5. `acr_values` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1.2.1  
**Type:** Space-separated string  
**Purpose:** Request specific Authentication Context Class References  
**PingOne Support:** ✅ Supported (via policies)  
**Priority:** 🟡 Medium

**Why Add:**
- Controls authentication strength (MFA, biometric, etc.)
- Teaches authentication assurance levels
- Important for compliance (PSD2, FIDO, etc.)

**Implementation:**
```typescript
acr_values?: string; // Space-separated ACR values
```

**Education:**
- Requests specific authentication methods
- Example: `acr_values=urn:pingidentity:mfa` (require MFA)
- Server returns `acr` claim in ID token
- Used for step-up authentication

---

### 6. `ui_locales` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1.2.1  
**Type:** Space-separated language tags  
**Purpose:** Preferred languages for authentication UI  
**PingOne Support:** ✅ Supported  
**Priority:** 🟡 Medium

**Why Add:**
- Important for international apps
- Teaches localization in OAuth
- Simple to implement

**Implementation:**
```typescript
ui_locales?: string; // e.g., "en-US es-ES"
```

**Education:**
- Controls language of login/consent screens
- Example: `ui_locales=es-ES en-US` (Spanish preferred, English fallback)
- Uses BCP47 language tags
- Improves UX for international users

---

### 7. `claims_locales` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 3.1.2.1  
**Type:** Space-separated language tags  
**Purpose:** Preferred languages for claims (user data)  
**PingOne Support:** ✅ Supported  
**Priority:** 🔴 Low

**Why Add:**
- Completeness (pairs with `ui_locales`)
- Less commonly used than `ui_locales`

**Implementation:**
```typescript
claims_locales?: string; // e.g., "en-US es-ES"
```

---

### 8. `claims` Parameter (OIDC)
**Spec:** OpenID Connect Core 1.0 Section 5.5  
**Type:** JSON object  
**Purpose:** Request specific claims in ID token or UserInfo  
**PingOne Support:** ⚠️ Partial (via scopes, not direct claims parameter)  
**Priority:** 🟡 Medium

**Why Add:**
- Teaches fine-grained data requests
- Important for privacy (request only what you need)
- Advanced OIDC feature

**Implementation:**
```typescript
claims?: {
  userinfo?: {
    [claim: string]: { essential?: boolean; value?: string; values?: string[] } | null;
  };
  id_token?: {
    [claim: string]: { essential?: boolean; value?: string; values?: string[] } | null;
  };
};
```

**Education:**
- Request specific user data
- Example: Request only email and name, not full profile
- Can mark claims as "essential" (required)
- Privacy-friendly: request minimum necessary data

**Note:** PingOne primarily uses scopes for claim control, but supports claims parameter for advanced scenarios.

---

## ❌ Missing OAuth 2.0 Extensions (Should Consider)

### 9. Resource Indicators (RFC 8707)
**Spec:** RFC 8707  
**Parameter:** `resource`  
**Purpose:** Specify target API/resource for token  
**PingOne Support:** ✅ Supported (Resources API feature)  
**Priority:** 🟢 High

**Why Add:**
- Already have Resources API flow
- Teaches audience restriction
- Important for multi-API scenarios

**Implementation:**
```typescript
resource?: string | string[]; // Target API URL(s)
```

**Education:**
- Specify which API the token is for
- Example: `resource=https://api.example.com`
- Token will have `aud` claim matching resource
- Prevents token misuse across APIs

**Status:** ✅ Already implemented in Resources API flow, but not exposed as parameter in other flows

---

### 10. DPoP (Demonstrating Proof of Possession) - RFC 9449
**Spec:** RFC 9449  
**Purpose:** Bind tokens to client's cryptographic key  
**PingOne Support:** ❓ Unknown  
**Priority:** 🔴 Low (Advanced)

**Why Add:**
- Cutting-edge security feature
- Prevents token theft/replay
- Future-proofing

**Note:** Very advanced, may be overkill for educational tool

---

### 11. JWT Secured Authorization Request (JAR) - RFC 9101
**Spec:** RFC 9101  
**Parameter:** `request` (JWT containing all parameters)  
**Purpose:** Sign and encrypt authorization parameters  
**PingOne Support:** ✅ Supported (via PAR)  
**Priority:** 🔴 Low

**Why Add:**
- Already have PAR which is similar
- JAR is less common than PAR
- Adds complexity

**Note:** PAR is more modern and recommended over JAR

---

## 🎯 Recommended Implementation Priority

### Phase 1: High-Value, Easy Wins (Implement Now)
1. ✅ **`response_mode`** - DONE!
2. 🟢 **`login_hint`** - High UX value, easy to implement
3. 🟢 **`max_age`** - Important for security, teaches session concepts
4. 🟢 **`resource`** - Already have Resources API, just expose parameter

### Phase 2: Medium Priority (Next Sprint)
5. 🟡 **`display`** - Good for mobile/embedded scenarios
6. 🟡 **`id_token_hint`** - Important for SSO patterns
7. 🟡 **`acr_values`** - Teaches authentication strength
8. 🟡 **`ui_locales`** - International apps

### Phase 3: Completeness (Future)
9. 🟡 **`claims`** - Advanced OIDC feature
10. 🔴 **`claims_locales`** - Pairs with ui_locales
11. 🔴 **DPoP** - Cutting edge, may be too advanced

---

## 📚 Educational Value Matrix

| Parameter | Spec Compliance | Real-World Usage | PingOne Support | Teaching Value | Complexity |
|-----------|----------------|------------------|-----------------|----------------|------------|
| `response_mode` | ✅ High | ✅ High | ✅ Full | ✅ High | 🟢 Low |
| `login_hint` | ✅ High | ✅ Very High | ✅ Full | ✅ High | 🟢 Low |
| `max_age` | ✅ High | ✅ High | ✅ Full | ✅ High | 🟢 Low |
| `resource` | ✅ High | ✅ High | ✅ Full | ✅ High | 🟢 Low |
| `display` | ✅ Medium | 🟡 Medium | ✅ Full | 🟡 Medium | 🟢 Low |
| `id_token_hint` | ✅ High | 🟡 Medium | ✅ Full | 🟡 Medium | 🟡 Medium |
| `acr_values` | ✅ High | 🟡 Medium | ✅ Partial | ✅ High | 🟡 Medium |
| `ui_locales` | ✅ Medium | 🟡 Medium | ✅ Full | 🟡 Medium | 🟢 Low |
| `claims` | ✅ High | 🟡 Medium | ⚠️ Partial | ✅ High | 🔴 High |
| `claims_locales` | ✅ Low | 🔴 Low | ✅ Full | 🔴 Low | 🟢 Low |
| DPoP | ✅ Medium | 🔴 Low | ❓ Unknown | 🟡 Medium | 🔴 Very High |

---

## 🎓 Educational Approach

### For Each Parameter, Provide:

1. **What it is** - Simple explanation
2. **When to use it** - Real-world scenarios
3. **How it works** - Technical details
4. **Example** - Concrete code/URL example
5. **Security implications** - Why it matters
6. **PingOne specifics** - Any PingOne quirks

### UI Pattern (Similar to response_mode dropdown):

```
Parameter Name                          [What is this?]
┌─────────────────────────────────────────────────┐
│ Value (with smart defaults)              ▼     │
└─────────────────────────────────────────────────┘

📝 Brief description of selected value
Best for: Use case

[Click "What is this?" to expand education panel]
```

---

## 🚀 Implementation Recommendations

### 1. Create Reusable Education Components

**File:** `src/v8/components/ParameterEducation.tsx`

Generic component that can explain any OAuth/OIDC parameter with:
- Dropdown/input for value
- Inline description
- Expandable education panel
- Examples
- Security notes

### 2. Group Related Parameters

**Advanced Authentication Section:**
- `prompt`
- `max_age`
- `login_hint`
- `id_token_hint`
- `acr_values`

**Localization Section:**
- `ui_locales`
- `claims_locales`

**Display Section:**
- `display`
- `response_mode`

### 3. Progressive Disclosure

- **Basic Mode:** Show only essential parameters
- **Advanced Mode:** Show all parameters with education
- **Expert Mode:** Raw parameter editing

### 4. Smart Defaults

- `display=page` (most common)
- `ui_locales=en-US` (default to English)
- `max_age` - No default (optional)
- `login_hint` - Empty (optional)

---

## 📊 Impact Assessment

### Adding These Parameters Will:

✅ **Improve Spec Compliance** - Cover 95%+ of OAuth/OIDC spec  
✅ **Better Education** - Teach real-world OAuth patterns  
✅ **Match PingOne** - Expose PingOne's full capabilities  
✅ **Improve UX** - `login_hint` and `display` significantly improve user experience  
✅ **Teach Security** - `max_age`, `acr_values` teach authentication strength  
✅ **Enable Advanced Scenarios** - SSO, MFA, internationalization  

### Risks:

⚠️ **Complexity** - More parameters = more to learn  
⚠️ **UI Clutter** - Need good progressive disclosure  
⚠️ **Testing** - More parameters = more test cases  

### Mitigation:

✅ **Progressive Disclosure** - Hide advanced parameters by default  
✅ **Smart Defaults** - Most parameters optional with good defaults  
✅ **Education** - Clear explanations for each parameter  
✅ **Grouping** - Logical sections (auth, localization, display)  

---

## 🎯 Next Steps

1. **Implement Phase 1 Parameters** (login_hint, max_age, resource)
2. **Create ParameterEducation component** (reusable pattern)
3. **Add to CredentialsFormV8U** (with progressive disclosure)
4. **Update integration services** (pass parameters to PingOne)
5. **Add tests** (verify parameters work correctly)
6. **Document** (update guides and examples)

---

## 📝 Summary

**Currently Missing (High Priority):**
- `login_hint` - Pre-fill username (huge UX win)
- `max_age` - Force fresh auth (security)
- `resource` - Target API (already have flow, just expose parameter)
- `display` - UI control (mobile/embedded)
- `id_token_hint` - SSO patterns
- `acr_values` - Auth strength
- `ui_locales` - Internationalization

**Already Have:**
- ✅ All core OAuth/OIDC parameters
- ✅ PKCE
- ✅ PAR
- ✅ `prompt`
- ✅ `response_mode` (just added!)

**Recommendation:**
Focus on Phase 1 (login_hint, max_age, resource) - these provide the most value with least complexity.

---

**Status:** 📋 Analysis Complete - Ready for Implementation
