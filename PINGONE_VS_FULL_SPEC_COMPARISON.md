# PingOne vs Full OAuth/OIDC Spec - Parameter Support Comparison

## Overview

This document compares the advanced OAuth 2.0 and OIDC parameters supported by **PingOne** versus the **full specification**. Understanding these differences helps set proper expectations and guides users to the right flows.

---

## Parameter Support Matrix

| Parameter | PingOne Support | Full Spec | Where to Try |
|-----------|----------------|-----------|--------------|
| **Audience** | ✅ Good | ✅ Mandatory | OAuth/OIDC Authz Flows |
| **Prompt** | ✅ Good | ✅ Mandatory | OAuth/OIDC Authz Flows |
| **Claims Request** | ✅ Good | ✅ Mandatory (OIDC) | OIDC Authz Flow |
| **Resource Indicators (RFC 8707)** | ❌ Not Supported | ✅ Optional | Demo Flow Only |
| **Display Parameter** | ⚠️ Limited | ✅ Optional | Demo Flow Only |
| **ACR Values** | ⚠️ Limited | ✅ Optional | Demo Flow Only |
| **Max Age** | ⚠️ Limited | ✅ Optional | Demo Flow Only |
| **UI Locales** | ❌ Not Supported | ✅ Optional | Demo Flow Only |
| **ID Token Hint** | ⚠️ Limited | ✅ Optional | Demo Flow Only |
| **Login Hint** | ⚠️ Limited | ✅ Optional | Demo Flow Only |

**Legend:**
- ✅ Good - Reliable, well-supported
- ⚠️ Limited - May work in specific configurations, not widely tested
- ❌ Not Supported - Not available or consistently ignored

---

## Detailed Parameter Breakdown

### ✅ Well-Supported by PingOne

#### 1. Audience Parameter
**Spec:** OAuth 2.0 / OIDC  
**PingOne Status:** ✅ Supported  
**Purpose:** Specifies the intended recipient (API/resource server) of the access token

**Implementation:**
```javascript
// Authorization URL
?audience=https://api.example.com

// Resulting Access Token
{
  "aud": "https://api.example.com",
  ...
}
```

**PingOne Notes:**
- Supported in most PingOne environments
- May require "Allowed Audiences" configuration in application settings
- Appears reliably in the `aud` claim of access tokens

**Where to Use:** OAuth/OIDC Authorization Code Flows

---

#### 2. Prompt Parameter
**Spec:** OIDC Core 1.0, Section 3.1.2.1  
**PingOne Status:** ✅ Supported  
**Purpose:** Controls authentication and consent UI behavior

**Values:**
- `none` - No UI, fail if user not authenticated
- `login` - Force re-authentication
- `consent` - Force consent screen
- `select_account` - Account selection UI

**Implementation:**
```javascript
// Authorization URL
?prompt=login consent

// Behavior
- User must re-authenticate even if session exists
- Consent screen always shown
```

**PingOne Notes:**
- Well-supported across all values
- `login` reliably forces re-authentication
- `consent` always shows consent screen
- Behavior is consistent and predictable

**Where to Use:** OAuth/OIDC Authorization Code Flows

---

#### 3. Claims Request (OIDC only)
**Spec:** OIDC Core 1.0, Section 5.5  
**PingOne Status:** ✅ Supported  
**Purpose:** Request specific claims to be returned in ID token or UserInfo response

**Implementation:**
```javascript
// Authorization URL
?claims={"id_token":{"email":{"essential":true},"name":null}}

// Resulting ID Token
{
  "email": "user@example.com",
  "name": "John Doe",
  ...
}
```

**PingOne Notes:**
- Core OIDC feature, well-supported
- Claims must exist in user profile
- Essential vs voluntary honored
- Works with both ID token and UserInfo endpoint

**Where to Use:** OIDC Authorization Code Flow

---

### ❌ Not Supported by PingOne

#### 4. Resource Indicators (RFC 8707)
**Spec:** RFC 8707 (2019)  
**PingOne Status:** ❌ Not Supported  
**Purpose:** Specify multiple target resource servers for token

**Implementation:**
```javascript
// Authorization URL (NOT supported by PingOne)
?resource=https://api1.example.com&resource=https://api2.example.com

// Would result in (with compliant server)
{
  "aud": ["https://api1.example.com", "https://api2.example.com"],
  ...
}
```

**Why Not Supported:**
- Newer specification (2019)
- Complex token scoping logic required
- Requires resource server registration
- Not widely adopted yet

**Where to Try:** Advanced OAuth Parameters Demo Flow

---

#### 5. Display Parameter
**Spec:** OIDC Core 1.0, Section 3.1.2.1  
**PingOne Status:** ⚠️ Limited (often ignored)  
**Purpose:** Specify how authorization server should render UI

**Values:**
- `page` - Full page (default)
- `popup` - Popup window
- `touch` - Touch-friendly UI
- `wap` - WAP-optimized UI

**Implementation:**
```javascript
// Authorization URL
?display=popup

// Expected behavior: UI optimized for popup
// Reality: Often ignored by authorization servers
```

**Why Limited Support:**
- Requires multiple UI implementations
- Server-side adaptation complex
- Most servers stick with default UI
- Mobile apps handle UI differently

**Where to Try:** Advanced OAuth Parameters Demo Flow

---

#### 6. UI Locales
**Spec:** OIDC Core 1.0, Section 3.1.2.1  
**PingOne Status:** ❌ Not Supported (or limited)  
**Purpose:** Specify preferred languages for authentication UI

**Implementation:**
```javascript
// Authorization URL
?ui_locales=en-US es-ES fr-FR

// Expected: UI in user's preferred language
// Reality: Often ignored
```

**Why Not Supported:**
- Requires full internationalization (i18n)
- Multiple language support expensive
- Often uses browser locale instead
- Complex maintenance overhead

**Where to Try:** Advanced OAuth Parameters Demo Flow

---

### ⚠️ Limited Support by PingOne

#### 7. ACR Values
**Spec:** OIDC Core 1.0, Section 3.1.2.1  
**PingOne Status:** ⚠️ Limited  
**Purpose:** Request specific authentication context class

**Implementation:**
```javascript
// Authorization URL
?acr_values=urn:mace:incommon:iap:silver urn:mace:incommon:iap:bronze

// Resulting token (if supported)
{
  "acr": "urn:mace:incommon:iap:silver",
  ...
}
```

**Why Limited:**
- Requires multiple authentication methods configured
- Complex authentication policy setup
- Enterprise feature, not default
- May work in advanced PingOne configurations

**Where to Try:** Advanced OAuth Parameters Demo Flow

---

#### 8. Max Age
**Spec:** OIDC Core 1.0, Section 3.1.2.1  
**PingOne Status:** ⚠️ Limited  
**Purpose:** Maximum authentication age allowed

**Implementation:**
```javascript
// Authorization URL
?max_age=3600

// If last auth older than 1 hour, user must re-authenticate
// Resulting token
{
  "auth_time": 1699999999,
  ...
}
```

**Why Limited:**
- Requires session tracking
- Policy enforcement overhead
- May conflict with SSO settings
- Works better with enterprise configurations

**Where to Try:** Advanced OAuth Parameters Demo Flow

---

#### 9. Login Hint
**Spec:** OIDC Core 1.0, Section 3.1.2.1  
**PingOne Status:** ⚠️ Limited  
**Purpose:** Pre-populate username field

**Implementation:**
```javascript
// Authorization URL
?login_hint=user@example.com

// Expected: Username field pre-filled
// Reality: Depends on login page implementation
```

**Why Limited:**
- Depends on login page customization
- May be ignored by default themes
- Works better with custom login pages
- Security considerations for pre-filling

**Where to Try:** Can try in OAuth/OIDC flows, but Advanced OAuth Parameters Demo shows ideal behavior

---

#### 10. ID Token Hint
**Spec:** OIDC Core 1.0, Section 3.1.2.1  
**PingOne Status:** ⚠️ Limited  
**Purpose:** Enable seamless re-authentication

**Implementation:**
```javascript
// Authorization URL
?id_token_hint=eyJhbGciOiJ...

// Expected: Seamless re-auth for same user
// Reality: Requires token validation, often not implemented
```

**Why Limited:**
- Complex token validation required
- Security implications
- Session management overhead
- Works better with enterprise SSO

**Where to Try:** Advanced OAuth Parameters Demo Flow

---

## Flow Recommendations

### For PingOne Production Use:
**Use Real Flows:**
- OAuth Authorization Code Flow (V6)
- OIDC Authorization Code Flow (V6)

**Parameters Available:**
- ✅ Audience
- ✅ Prompt
- ✅ Claims Request (OIDC only)

**Hidden Parameters:**
- ❌ Resources (RFC 8707) - Not shown, not sent
- ❌ Display - Not shown, not sent

---

### For Learning & Exploration:
**Use Demo Flow:**
- Advanced OAuth Parameters Demo

**Parameters Demonstrated:**
- All 10+ parameters shown
- Mock tokens generated
- Educational content provided
- No PingOne limitations

**Purpose:**
- Learn the full OAuth/OIDC specification
- Understand what's possible with other auth servers
- See how parameters affect tokens
- Educational / demo purposes

---

## Migration Guide

### Moving from Demo to Production

If you configured parameters in the demo flow and want to use them in production:

#### ✅ Supported - Can Use in PingOne:
1. **Audience** → Copy to Advanced OAuth Parameters page
2. **Prompt** → Copy to Advanced OAuth Parameters page
3. **Claims Request** → Copy to Advanced OIDC Parameters page

#### ❌ Not Supported - Demo Only:
1. **Resources** → Demo only, won't work with PingOne
2. **Display** → Demo only, likely ignored by PingOne
3. **ACR Values** → Demo only, requires enterprise setup
4. **Max Age** → Demo only, check PingOne session policies instead
5. **UI Locales** → Demo only, use browser locale
6. **Login Hint** → Limited, may not work consistently
7. **ID Token Hint** → Demo only, complex implementation

---

## Why We Split These Flows

### Design Decision:
We separated PingOne flows from the demo flow to:

1. **Set Clear Expectations**
   - Users know what works with PingOne
   - No disappointment when parameters are ignored
   - Clear feedback on what to expect

2. **Improve User Experience**
   - Real flows show only working parameters
   - Demo flow shows full specification
   - No confusion about "why isn't this working?"

3. **Educational Value**
   - Demo flow teaches full OAuth/OIDC spec
   - Users can learn advanced concepts
   - Preparation for other authorization servers

4. **Maintainability**
   - Clear separation of concerns
   - Easier to update as PingOne evolves
   - Mock responses don't affect real flows

---

## Testing Your Parameters

### In Real Flows (OAuth/OIDC Authz):
1. Configure audience, prompt, claims
2. Save parameters
3. Run the flow
4. Check authorization URL in console logs
5. Verify tokens have correct claims
6. Test with PingOne

### In Demo Flow:
1. Configure ALL parameters
2. Generate mock URL
3. See how URL would look
4. Generate mock tokens
5. See how parameters would affect tokens
6. Learn without limitations

---

## Future Updates

As PingOne adds support for more parameters, we will:
1. Update this comparison chart
2. Move supported parameters to real flows
3. Update flow descriptions
4. Keep demo flow for full spec education

**Check back for updates as the OAuth/OIDC landscape evolves!**

---

## Summary Table

| What You Want | Where to Go | What Parameters |
|---------------|-------------|-----------------|
| **Production OAuth with PingOne** | OAuth Authorization Code (V6) | Audience, Prompt |
| **Production OIDC with PingOne** | OIDC Authorization Code (V6) | Audience, Prompt, Claims |
| **Learn Full OAuth/OIDC Spec** | Advanced OAuth Parameters Demo | All 10+ parameters |
| **Test Unsupported Features** | Advanced OAuth Parameters Demo | Resources, Display, ACR, etc. |
| **Mock/Demo for Presentation** | Advanced OAuth Parameters Demo | Everything with mock responses |

---

**Last Updated:** October 2025  
**PingOne Version:** Latest  
**OAuth Spec:** RFC 6749, RFC 6750, RFC 8707  
**OIDC Spec:** OpenID Connect Core 1.0

---

## Quick Reference

### PingOne Authorization Code Flows:
```
✅ Supported: Audience, Prompt, Claims Request (OIDC)
❌ Hidden: Resources, Display
🔗 Link: /flows/oauth-authorization-code-v6 or /flows/oidc-authorization-code-v6
```

### Advanced OAuth Parameters Demo:
```
✅ Demonstrates: All 10+ advanced parameters
🎭 Mock Responses: Generated tokens with all claims
📚 Educational: Learn full OAuth/OIDC specification
🔗 Link: /flows/advanced-oauth-params-demo
```

**Choose the right flow for your needs!**
