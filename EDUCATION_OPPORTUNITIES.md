# Education Opportunities - "What is this?" Components

**Date:** 2024-11-22  
**Purpose:** Identify parameters that would benefit from educational components

---

## Current Status

### ✅ Already Have Educational Components
1. **Response Mode** - ResponseModeDropdownV8 ✅
2. **Login Hint** - LoginHintInputV8 ✅
3. **Max Age** - MaxAgeInputV8 ✅
4. **Display Mode** - DisplayModeDropdownV8 ✅
5. **Response Type** - ResponseTypeDropdownV8 ✅ (created, needs integration)

### 🎯 High Priority - Should Add Education

#### 1. **PKCE (Proof Key for Code Exchange)** 🔐
**Current:** Simple checkbox with tooltip  
**Should Be:** Educational component explaining:
- What PKCE is (prevents authorization code interception)
- Why it's required in OAuth 2.1
- How it works (code_challenge/code_verifier)
- When to use it (always for public clients)
- Security benefits
- PKCE enforcement levels (OPTIONAL, REQUIRED, S256_REQUIRED)

**Priority:** ⭐⭐⭐⭐⭐ (Very High)  
**Reason:** Critical security feature, often misunderstood

---

#### 2. **Client Authentication Method** 🔑
**Current:** Simple dropdown  
**Should Be:** Educational component explaining:
- What client authentication is
- Different methods:
  - `none` - Public clients (no secret)
  - `client_secret_basic` - HTTP Basic Auth
  - `client_secret_post` - POST body
  - `client_secret_jwt` - JWT assertion
  - `private_key_jwt` - Private key JWT
- When to use each method
- Security implications
- PingOne support for each

**Priority:** ⭐⭐⭐⭐⭐ (Very High)  
**Reason:** Confusing for beginners, critical for security

---

#### 3. **Scopes** 🔑
**Current:** Text input with tooltip  
**Should Be:** Educational component explaining:
- What scopes are (permissions)
- Common scopes:
  - `openid` - Required for OIDC
  - `profile` - User profile info
  - `email` - Email address
  - `address` - Physical address
  - `phone` - Phone number
  - `offline_access` - Refresh token
- OAuth 2.0 vs OIDC scopes
- Custom scopes
- Scope consent screens

**Priority:** ⭐⭐⭐⭐⭐ (Very High)  
**Reason:** Fundamental OAuth concept, often misunderstood

---

#### 4. **Redirect URI** 🔄
**Current:** Text input with tooltip  
**Should Be:** Educational component explaining:
- What redirect URI is (callback URL)
- Why it must match exactly
- Security implications (prevents redirect attacks)
- Common patterns:
  - `http://localhost:3000/callback` - Development
  - `https://app.example.com/callback` - Production
  - `myapp://callback` - Mobile deep links
- Multiple redirect URIs
- Wildcard restrictions

**Priority:** ⭐⭐⭐⭐⭐ (Very High)  
**Reason:** Common source of errors, security critical

---

#### 5. **Client Type (Public vs Confidential)** 🔓🔒
**Current:** Radio buttons with tooltip  
**Should Be:** Educational component explaining:
- What client types are
- **Public Client:**
  - Cannot keep secrets (SPA, mobile, desktop)
  - Must use PKCE
  - Examples: React app, mobile app
- **Confidential Client:**
  - Can keep secrets (backend server)
  - Can use client_secret
  - Examples: Node.js server, Java backend
- Security implications
- How to choose

**Priority:** ⭐⭐⭐⭐⭐ (Very High)  
**Reason:** Fundamental concept, affects all other choices

---

#### 6. **Grant Type** 📜
**Current:** Read-only display  
**Should Be:** Educational component explaining:
- What grant type is
- Different grant types:
  - `authorization_code` - Most secure
  - `implicit` - Deprecated
  - `client_credentials` - Machine-to-machine
  - `password` - Resource Owner Password (deprecated)
  - `refresh_token` - Get new access token
  - `urn:ietf:params:oauth:grant-type:device_code` - Device flow
  - `urn:ietf:params:oauth:grant-type:token-exchange` - Token exchange
- When each is used
- Relationship to response_type

**Priority:** ⭐⭐⭐⭐ (High)  
**Reason:** Important concept, but read-only so less critical

---

#### 7. **Application Type** 📱
**Current:** Dropdown with tooltip  
**Should Be:** Educational component explaining:
- Different application types:
  - **Web App** - Traditional server-side
  - **SPA** - Single Page Application
  - **Mobile** - iOS/Android native
  - **Desktop** - Electron, native apps
  - **CLI** - Command-line tools
  - **M2M** - Machine-to-machine
  - **Backend** - Microservices
- Recommended flow for each
- Client type for each
- PKCE requirements

**Priority:** ⭐⭐⭐⭐ (High)  
**Reason:** Helps users choose correct flow

---

#### 8. **Prompt Parameter** 🎭
**Current:** Simple dropdown with modal  
**Should Be:** Educational component (inline) explaining:
- What prompt does
- Values:
  - `none` - No UI (silent auth)
  - `login` - Force login screen
  - `consent` - Force consent screen
  - `select_account` - Account picker
- When to use each
- Combining with max_age
- Error handling (login_required, consent_required)

**Priority:** ⭐⭐⭐⭐ (High)  
**Reason:** Already has modal, but inline would be better

---

### 🟡 Medium Priority - Nice to Have

#### 9. **Environment ID** 🌍
**Current:** Text input  
**Should Be:** Educational component explaining:
- What environment ID is (PingOne tenant)
- Where to find it
- Format (UUID)
- Development vs production environments

**Priority:** ⭐⭐⭐ (Medium)  
**Reason:** PingOne-specific, but important

---

#### 10. **Client ID** 🆔
**Current:** Text input  
**Should Be:** Educational component explaining:
- What client ID is (public identifier)
- Where to find it
- Not a secret (can be public)
- Format (UUID or string)

**Priority:** ⭐⭐⭐ (Medium)  
**Reason:** Basic concept, but good for beginners

---

#### 11. **Client Secret** 🔐
**Current:** Password input with show/hide  
**Should Be:** Educational component explaining:
- What client secret is
- When it's required (confidential clients)
- Security: Never expose in frontend
- Rotation best practices
- When NOT to use (public clients)

**Priority:** ⭐⭐⭐ (Medium)  
**Reason:** Security critical, but already has some education

---

#### 12. **Issuer URL** 🌐
**Current:** Text input  
**Should Be:** Educational component explaining:
- What issuer URL is (OIDC discovery endpoint)
- Format: `https://auth.pingone.com/{environmentId}/as`
- Used for OIDC Discovery
- Relationship to .well-known/openid-configuration

**Priority:** ⭐⭐⭐ (Medium)  
**Reason:** OIDC-specific, advanced feature

---

### 🔵 Lower Priority - Advanced Features

#### 13. **Post-Logout Redirect URI** 🚪
**Current:** Text input with tooltip  
**Should Be:** Educational component explaining:
- What it is (where to go after logout)
- Relationship to end_session_endpoint
- Security considerations

**Priority:** ⭐⭐ (Low)  
**Reason:** Less commonly used

---

#### 14. **Refresh Token** 🔄
**Current:** Checkbox  
**Should Be:** Educational component explaining:
- What refresh tokens are
- Long-lived vs short-lived
- Security considerations
- Rotation strategies
- When to use

**Priority:** ⭐⭐ (Low)  
**Reason:** Advanced feature, already has some education

---

## Recommended Implementation Order

### Phase 1: Critical Security & Core Concepts (Week 1)
1. ✅ **Response Mode** - DONE
2. ✅ **Login Hint** - DONE
3. ✅ **Max Age** - DONE
4. ✅ **Display Mode** - DONE
5. 🎯 **PKCE** - DO NEXT (most important security feature)
6. 🎯 **Client Type** - DO NEXT (fundamental concept)
7. 🎯 **Client Authentication Method** - DO NEXT (security critical)

### Phase 2: OAuth/OIDC Fundamentals (Week 2)
8. 🎯 **Scopes** - Core OAuth concept
9. 🎯 **Redirect URI** - Common error source
10. 🎯 **Response Type** - Already created, just integrate
11. 🎯 **Grant Type** - Important concept

### Phase 3: User Experience (Week 3)
12. 🎯 **Application Type** - Helps users choose
13. 🎯 **Prompt Parameter** - Already has modal, convert to inline
14. 🟡 **Environment ID** - PingOne-specific
15. 🟡 **Client ID/Secret** - Basic concepts

### Phase 4: Advanced Features (Week 4)
16. 🟡 **Issuer URL** - OIDC Discovery
17. 🔵 **Post-Logout Redirect URI** - Logout flows
18. 🔵 **Refresh Token** - Token management

---

## Component Pattern

All educational components should follow this pattern:

```typescript
interface EducationalComponentProps {
  value: string | boolean | number;
  onChange: (value: any) => void;
  disabled?: boolean;
  className?: string;
}

// Features:
// 1. Label with "What is this?" button
// 2. Input/dropdown/checkbox
// 3. Inline description (brief)
// 4. Expandable education panel with:
//    - Overview
//    - Use cases
//    - Examples
//    - Security notes
//    - Best practices
// 5. Visual indicators (icons, badges, colors)
// 6. Accessibility (contrast, keyboard nav)
```

---

## Benefits of Educational Components

✅ **Better Learning** - Users understand OAuth/OIDC deeply  
✅ **Fewer Errors** - Clear explanations prevent mistakes  
✅ **Self-Service** - Users don't need external docs  
✅ **Confidence** - Users feel empowered to make choices  
✅ **Best Practices** - Teach security and standards  
✅ **Consistent UX** - Same pattern everywhere  
✅ **Progressive Disclosure** - Info available when needed  

---

## Next Steps

1. **Create PKCEInputV8** - Most important security feature
2. **Create ClientTypeRadioV8** - Fundamental concept
3. **Create ClientAuthMethodDropdownV8** - Security critical
4. **Create ScopesInputV8** - Core OAuth concept
5. **Create RedirectUriInputV8** - Common error source

---

**Status:** 📋 Analysis Complete - Ready to Implement Phase 1
