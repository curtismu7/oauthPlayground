# Authorization Flows Comprehensive Guide & Testing Plan

## 🎯 **Executive Summary**

This guide documents all authorization-based flows in the OAuth Playground, their differences, current state, and comprehensive testing plan.

---

## 📊 **Flow Inventory**

### **V6 Flows (Current Production - 12 flows)**

| Flow | File | Uses Modal | Controller | Status |
|------|------|------------|------------|--------|
| OAuth Authorization Code | `OAuthAuthorizationCodeFlowV6.tsx` | ✅ Yes | `useAuthorizationCodeFlowController` | ✅ Fixed |
| OIDC Authorization Code | `OIDCAuthorizationCodeFlowV6.tsx` | ✅ Yes | `useAuthorizationCodeFlowController` | ✅ Fixed |
| OIDC Hybrid | `OIDCHybridFlowV6.tsx` | ✅ Yes | `useHybridFlowController` | ⚠️ Needs Testing |
| PAR (PingOne) - New | `PingOnePARFlowV6_New.tsx` | ✅ Yes | `useAuthorizationCodeFlowController` | ⚠️ Needs Testing |
| PAR (PingOne) - Old | `PingOnePARFlowV6.tsx` | ❓ Check | Mixed | ⚠️ Legacy |
| RAR - New | `RARFlowV6_New.tsx` | ✅ Yes | `useAuthorizationCodeFlowController` | ⚠️ Needs Testing |
| RAR - Old | `RARFlowV6.tsx` | ❓ Check | Mixed | ⚠️ Legacy |
| OAuth Implicit | `OAuthImplicitFlowV6.tsx` | ❌ No | `useImplicitFlowController` | ℹ️ Different Flow |
| OIDC Implicit | `OIDCImplicitFlowV6.tsx` | ❌ No | `useImplicitFlowController` | ℹ️ Different Flow |
| OIDC Implicit Full | `OIDCImplicitFlowV6_Full.tsx` | ❌ No | `useImplicitFlowController` | ℹ️ Different Flow |
| Device Authorization (OAuth) | `DeviceAuthorizationFlowV6.tsx` | ❌ No | Custom | ℹ️ Different Flow |
| Device Authorization (OIDC) | `OIDCDeviceAuthorizationFlowV6.tsx` | ❌ No | Custom | ℹ️ Different Flow |

### **V5 Flows (Older - 3 flows)**
- `AuthorizationCodeFlowV5.tsx` - Legacy
- `OIDCAuthorizationCodeFlowV5.tsx` - Legacy
- `OIDCHybridFlowV5.tsx` - Legacy
- `RARFlowV5.tsx` - Legacy

### **V3 Flows (Oldest - 4 flows)**
- `OAuth2AuthorizationCodeFlow.tsx`
- `OAuthAuthorizationCodeFlowV3.tsx`
- `OIDCAuthorizationCodeFlowV3.tsx`
- `EnhancedAuthorizationCodeFlowV3.tsx`

---

## 🔑 **Key Differences Between Flow Types**

### **1. OAuth vs OIDC Authorization Code**

| Aspect | OAuth 2.0 | OpenID Connect (OIDC) |
|--------|-----------|----------------------|
| **Purpose** | Authorization (API access) | Authentication (user identity) + Authorization |
| **Tokens** | Access Token + Refresh Token | Access Token + Refresh Token + **ID Token** |
| **Scope** | Custom scopes (e.g., `read`, `write`) | **Must include `openid`** + profile, email, etc. |
| **User Info** | No standard endpoint | `/userinfo` endpoint for user claims |
| **ID Token** | N/A | JWT with user claims (sub, email, name, etc.) |
| **Spec** | RFC 6749 | Built on OAuth 2.0 (RFC 6749 + OpenID Connect Core 1.0) |

### **2. Hybrid Flow (OIDC Only)**

- **What it is:** Combination of authorization code flow + implicit flow
- **Response types:** `code id_token`, `code token`, `code id_token token`
- **Returns:** Authorization code + ID token and/or access token in **fragment** (#)
- **Use case:** Immediate ID token validation before exchanging code for tokens
- **Redirect:** Uses URL **fragment** (#) instead of query parameters (?)

### **3. PAR (Pushed Authorization Request)**

- **What it is:** Enhanced security by pushing authorization parameters to token endpoint first
- **RFC:** RFC 9126
- **Flow:**
  1. POST authorization parameters to `/as/par` endpoint → get `request_uri`
  2. Redirect user to `/as/authorize?request_uri=<uri>&client_id=<id>`
- **Benefits:**
  - Parameters not visible in browser URL
  - Can send large authorization requests
  - Prevents request tampering
- **PingOne:** Requires `requirePushedAuthorizationRequest: true` in client config

### **4. RAR (Rich Authorization Request)**

- **What it is:** Structured authorization details with fine-grained permissions
- **RFC:** RFC 9396
- **Format:** JSON array of authorization details
```json
{
  "authorization_details": [
    {
      "type": "payment",
      "actions": ["read", "write"],
      "locations": ["https://api.bank.com/accounts/12345"],
      "amount": 100.00,
      "currency": "USD"
    }
  ]
}
```
- **Use cases:** Payment initiation, open banking, healthcare, fine-grained resource access

### **5. Device Authorization Flow**

- **What it is:** For devices without browsers (smart TVs, CLI tools, IoT)
- **RFC:** RFC 8628
- **Flow:**
  1. Device requests `device_code` and `user_code`
  2. User visits verification URL on another device
  3. User enters `user_code`
  4. Device polls token endpoint until user completes authorization
- **Polling:** Device continuously polls `/as/token` with `device_code`

### **6. Implicit Flow (Legacy)**

- **What it is:** Returns tokens directly in URL fragment (no code exchange)
- **Security:** ⚠️ **Deprecated** - tokens exposed in browser history, no refresh token
- **Modern alternative:** Use Authorization Code with PKCE instead
- **Still useful for:** Learning, legacy app compatibility

---

## 🎭 **Controllers Used**

### **1. `useAuthorizationCodeFlowController`**
- **Used by:** OAuth AuthZ, OIDC AuthZ, PAR, RAR
- **Features:**
  - PKCE generation
  - Authorization URL generation
  - Code exchange for tokens
  - Popup/redirect handling
  - Token refresh
  - UserInfo fetching (OIDC)
- **Key methods:**
  - `generatePkceCodes()`
  - `generateAuthorizationUrl()`
  - `exchangeCodeForTokens()`
  - `fetchUserInfo()`
  - `refreshTokens()`

### **2. `useHybridFlowController`**
- **Used by:** OIDC Hybrid Flow
- **Features:**
  - Returns code + tokens in URL fragment
  - Immediate ID token validation
  - Code exchange for additional tokens
- **Key difference:** Parses both fragment (#) and query (?) parameters

### **3. `useImplicitFlowController`**
- **Used by:** OAuth Implicit, OIDC Implicit
- **Features:**
  - Returns tokens directly in URL fragment
  - No code exchange
  - No refresh token
- **Security:** ⚠️ Less secure, deprecated by OAuth 2.1

### **4. Device Flow Controllers**
- **Used by:** Device Authorization flows
- **Features:**
  - Device code generation
  - User code display
  - Polling for token
  - QR code support

---

## 🔧 **Authentication Modal Service**

### **Current Implementation:**
```typescript
// src/services/authenticationModalService.tsx
AuthenticationModalService.showModal(
  isOpen,
  onClose,
  onContinue,
  authUrl,
  flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless',
  flowName,
  { description, redirectMode: 'popup' | 'redirect' }
)
```

### **Flows Using Modal:**
1. ✅ `OAuthAuthorizationCodeFlowV6.tsx`
2. ✅ `OIDCAuthorizationCodeFlowV6.tsx`
3. ✅ `OIDCHybridFlowV6.tsx`
4. ✅ `PingOnePARFlowV6_New.tsx`
5. ✅ `RARFlowV6_New.tsx`

### **Popup Callback Flow:**
1. User clicks "Redirect to PingOne" → Modal appears
2. User clicks "Continue to PingOne" → Popup opens, modal closes
3. User authenticates at PingOne → Redirects to `/authz-callback`
4. Callback page:
   - Detects flow type from `sessionStorage.getItem('active_oauth_flow')`
   - Stores auth code with flow-specific keys
   - Dispatches `auth-code-received` event to parent window
   - Auto-closes after 2 seconds
5. Parent window:
   - Event listener receives auth code
   - Sets code in controller
   - Advances to token exchange step

---

## 🧪 **Comprehensive Testing Plan**

### **Phase 1: Authorization Code Flows (Priority 1)**

#### **Test: OAuth Authorization Code Flow V6**
- [ ] Load page, verify credentials load
- [ ] Fill credentials (Env ID, Client ID, Client Secret, Redirect URI)
- [ ] Generate PKCE codes
- [ ] Generate Authorization URL
- [ ] Click "Redirect to PingOne" → Modal appears
- [ ] Click "Continue to PingOne" → Popup opens (not stuck!)
- [ ] Authenticate in popup → Popup shows success
- [ ] Popup closes after 2 seconds
- [ ] Parent window receives auth code → Step advances to 3
- [ ] Exchange code for tokens → Access token + Refresh token returned
- [ ] Verify tokens displayed
- [ ] Test "Start Over" button → Clears tokens, keeps credentials, back to Step 0
- [ ] Test "Reset Flow" button → Clears everything

#### **Test: OIDC Authorization Code Flow V6**
- [ ] Load page, verify credentials load
- [ ] Fill credentials (must include `openid` in scope!)
- [ ] Generate PKCE codes
- [ ] Generate Authorization URL
- [ ] Click "Redirect to PingOne" → Modal appears
- [ ] Click "Continue to PingOne" → Popup opens (not stuck!)
- [ ] Authenticate in popup → Popup shows success
- [ ] Popup closes after 2 seconds
- [ ] Parent window receives auth code → Step advances to 3
- [ ] Exchange code for tokens → Access token + Refresh token + **ID Token** returned
- [ ] Decode ID Token → Verify claims (sub, email, name, etc.)
- [ ] Fetch UserInfo → Verify user claims match ID token
- [ ] Test "Start Over" button
- [ ] Test "Reset Flow" button

---

### **Phase 2: Advanced Authorization Flows (Priority 2)**

#### **Test: OIDC Hybrid Flow V6**
- [ ] Load page, verify credentials load
- [ ] Fill credentials (scope must include `openid`)
- [ ] Select response type: `code id_token` or `code token` or `code id_token token`
- [ ] Generate PKCE codes
- [ ] Generate Authorization URL (verify `response_mode=fragment`)
- [ ] Click "Redirect to PingOne" → Modal appears
- [ ] Click "Continue to PingOne" → Popup opens
- [ ] Authenticate in popup → Returns to callback
- [ ] Verify tokens/code in URL **fragment** (#) not query (?)
- [ ] Verify ID token received immediately (if `id_token` in response_type)
- [ ] Exchange code for additional tokens
- [ ] Verify all tokens displayed correctly
- [ ] Test "Start Over" and "Reset Flow"

#### **Test: PAR Flow V6 (PingOne)**
- [ ] Load page, verify credentials load
- [ ] Fill credentials
- [ ] **Enable PAR in PingOne client config:** `requirePushedAuthorizationRequest: true`
- [ ] Generate PKCE codes
- [ ] Click "Generate Authorization Request" → POST to `/as/par`
- [ ] Verify `request_uri` returned (e.g., `urn:pingidentity:...`)
- [ ] Generate Authorization URL → Should use `request_uri` instead of full parameters
- [ ] Verify URL is short: `/as/authorize?request_uri=<uri>&client_id=<id>`
- [ ] Click "Redirect to PingOne" → Modal appears
- [ ] Authenticate via popup
- [ ] Exchange code for tokens
- [ ] Verify tokens returned correctly
- [ ] Test "Start Over" and "Reset Flow"

#### **Test: RAR Flow V6**
- [ ] Load page, verify credentials load
- [ ] Fill credentials
- [ ] Configure **authorization_details** JSON
```json
{
  "authorization_details": [
    {
      "type": "payment_initiation",
      "actions": ["read", "write"],
      "locations": ["https://api.example.com/payments"],
      "instructedAmount": {
        "currency": "USD",
        "amount": "100.00"
      }
    }
  ]
}
```
- [ ] Generate Authorization URL (verify `authorization_details` parameter)
- [ ] Click "Redirect to PingOne" → Modal appears
- [ ] Authenticate via popup
- [ ] Exchange code for tokens
- [ ] Verify `authorization_details` echoed in token response
- [ ] Test "Start Over" and "Reset Flow"

---

### **Phase 3: Implicit Flows (Priority 3)**

#### **Test: OAuth Implicit Flow V6**
- [ ] Load page, verify credentials load
- [ ] Fill credentials
- [ ] Generate Authorization URL (verify `response_type=token`)
- [ ] Click "Redirect to PingOne"
- [ ] Authenticate → Returns with tokens in URL **fragment** (#)
- [ ] Verify access token extracted from fragment
- [ ] Verify NO refresh token (implicit flow doesn't support it)
- [ ] Test "Start Over" and "Reset Flow"

#### **Test: OIDC Implicit Flow V6**
- [ ] Load page, verify credentials load
- [ ] Fill credentials (scope must include `openid`)
- [ ] Generate Authorization URL (verify `response_type=id_token token`)
- [ ] Click "Redirect to PingOne"
- [ ] Authenticate → Returns with ID token + access token in URL **fragment**
- [ ] Verify ID token extracted and decoded
- [ ] Verify access token extracted
- [ ] Verify NO refresh token
- [ ] Test "Start Over" and "Reset Flow"

---

### **Phase 4: Device Flows (Priority 4)**

#### **Test: Device Authorization Flow V6 (OAuth)**
- [ ] Load page, verify credentials load
- [ ] Fill credentials
- [ ] Click "Start Device Flow" → Request device code
- [ ] Verify `device_code` and `user_code` displayed
- [ ] Verify verification URL displayed (e.g., `https://auth.pingone.com/b9817c16-.../device`)
- [ ] Verify QR code generated
- [ ] Open verification URL in separate device/browser
- [ ] Enter `user_code`
- [ ] Authenticate
- [ ] Verify polling detects authorization
- [ ] Verify tokens returned
- [ ] Test "Start Over" and "Reset Flow"

#### **Test: Device Authorization Flow V6 (OIDC)**
- [ ] Same as OAuth Device Flow
- [ ] Verify ID token included in response
- [ ] Verify UserInfo fetched

---

## 🐛 **Known Issues & Fixes**

### **✅ Fixed Issues:**
1. **Modal button stuck on "Opening..."** - Fixed by removing state management
2. **Popup callback not working** - Fixed by adding event listener and flow detection
3. **Callback page redirects to wrong flow** - Fixed by storing `active_oauth_flow` in sessionStorage

### **⚠️ Issues to Watch For:**

1. **JAR (JWT-secured Authorization Request)**
   - **Error:** "The 'request' must be supplied when requireSignedRequestObject is on."
   - **Fix:** Disable `requireSignedRequestObject` in PingOne client config OR use PAR flow
   - **File:** `KNOWN_LIMITATIONS.md`

2. **Invalid Redirect URI**
   - **Symptoms:** "redirect_uri mismatch" error during token exchange
   - **Fix:** Implemented `redirectUriHelpers.ts` to store exact URI from auth URL
   - **Files:** `src/utils/redirectUriHelpers.ts`, `src/hooks/useAuthorizationCodeFlowController.ts`

3. **Credentials not persisting on refresh**
   - **Symptoms:** Credentials reset after page refresh
   - **Fix:** Fixed priority in `flowCredentialService.ts` to use flow-specific credentials first
   - **File:** `src/services/flowCredentialService.ts`

4. **Sections not collapsed by default**
   - **Symptoms:** All collapsible sections open on page load
   - **Fix:** Set `shouldCollapseAll = true` in all V6 flows
   - **Files:** All `*V6.tsx` flow files

---

## 📝 **Testing Checklist Template**

Use this for each flow:

```markdown
## Flow: [Flow Name]
**Date:** [Date]
**Tester:** [Name]

### Pre-Test Setup
- [ ] PingOne environment configured
- [ ] OAuth client created
- [ ] Redirect URI whitelisted
- [ ] Client secret available (if confidential client)
- [ ] JAR disabled (if not using PAR)

### Credentials Entry
- [ ] Environment ID loads/entered correctly
- [ ] Client ID loads/entered correctly
- [ ] Client Secret loads/entered correctly (if needed)
- [ ] Redirect URI loads/entered correctly
- [ ] Scope loads/entered correctly
- [ ] Credentials persist after refresh

### PKCE Generation (if applicable)
- [ ] PKCE codes generate successfully
- [ ] Code verifier displayed
- [ ] Code challenge displayed
- [ ] Codes persist after refresh

### Authorization URL Generation
- [ ] URL generates successfully
- [ ] URL contains correct parameters
- [ ] URL displayed in modal preview
- [ ] URL can be copied

### Authorization (Popup)
- [ ] "Redirect to PingOne" button works
- [ ] Modal appears
- [ ] "Continue to PingOne" button works
- [ ] Popup opens (not stuck on "Opening...")
- [ ] PingOne login page loads
- [ ] Authentication succeeds
- [ ] Popup shows success message
- [ ] Popup auto-closes after 2 seconds

### Callback Processing
- [ ] Parent window detects auth code
- [ ] Auth code displayed in UI
- [ ] Step advances to token exchange automatically
- [ ] Console shows: `✅ [useAuthorizationCodeFlowController] Popup callback received`

### Token Exchange
- [ ] Exchange button works
- [ ] Tokens returned successfully
- [ ] Access token displayed
- [ ] Refresh token displayed (if applicable)
- [ ] ID token displayed (if OIDC)
- [ ] Token expiration shown
- [ ] Tokens can be copied

### UserInfo (OIDC only)
- [ ] Fetch UserInfo button works
- [ ] User claims displayed
- [ ] Claims match ID token

### Token Refresh (if applicable)
- [ ] Refresh token button works
- [ ] New tokens returned
- [ ] Old tokens replaced

### Navigation
- [ ] "Previous" button works
- [ ] "Next" button works
- [ ] "Start Over" button clears tokens, keeps credentials
- [ ] "Reset Flow" button clears everything
- [ ] Step indicator shows correct step
- [ ] Compact mode toggle works
- [ ] Compact mode persists after refresh

### Error Handling
- [ ] Invalid credentials show error
- [ ] Missing required fields show error
- [ ] Network errors handled gracefully
- [ ] Invalid redirect URI caught
- [ ] Popup blocked warning shown

### Issues Found
[List any issues encountered]

### Notes
[Any additional notes]
```

---

## 🚀 **Next Steps**

1. **Test OAuth Authorization Code Flow V6** (already fixed)
2. **Test OIDC Authorization Code Flow V6** (already fixed)
3. **Test OIDC Hybrid Flow V6**
4. **Test PAR Flow V6**
5. **Test RAR Flow V6**
6. **Test Implicit Flows** (lower priority - deprecated)
7. **Test Device Flows** (lower priority - different UX)

---

## 📚 **Reference Documentation**

- **OAuth 2.0:** RFC 6749
- **PKCE:** RFC 7636
- **OpenID Connect:** OpenID Connect Core 1.0
- **Hybrid Flow:** OpenID Connect Core 1.0 Section 3.3
- **PAR:** RFC 9126
- **RAR:** RFC 9396
- **Device Authorization:** RFC 8628
- **OAuth 2.1:** Draft (deprecates implicit flow, mandates PKCE)

---

**Last Updated:** 2025-10-12
**Status:** Ready for comprehensive testing

