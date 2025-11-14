# 🔍 OAuth 2.0 vs OIDC Parameter Applicability Matrix
**Complete Guide to Which Parameters Apply Where**

---

## 📊 **Parameter Applicability Matrix**

| Parameter | OAuth 2.0 | OIDC | Notes |
|-----------|-----------|------|-------|
| **response_type** | ✅ Required | ✅ Required | OAuth: `code`, `token`<br>OIDC: `code`, `id_token`, `id_token token`, `code id_token`, etc. |
| **client_id** | ✅ Required | ✅ Required | Identical usage |
| **redirect_uri** | ⚠️ Recommended | ✅ Required | OIDC makes it mandatory |
| **scope** | ⚠️ Optional | ✅ Required | OIDC must include `openid` |
| **state** | ⚠️ Recommended | ⚠️ Recommended | CSRF protection (same in both) |
| **nonce** | ❌ Not used | ✅ Required* | *Required for Implicit/Hybrid, recommended for Code |
| **code_challenge** | ✅ PKCE | ✅ PKCE | Identical (PKCE extension) |
| **code_challenge_method** | ✅ PKCE | ✅ PKCE | Identical (PKCE extension) |
| **display** | ❌ Not defined | ✅ OIDC only | UI presentation mode |
| **prompt** | ❌ Not defined | ✅ OIDC only | Auth behavior control |
| **max_age** | ❌ Not defined | ✅ OIDC only | Session freshness |
| **ui_locales** | ❌ Not defined | ✅ OIDC only | UI language preference |
| **id_token_hint** | ❌ Not defined | ✅ OIDC only | ID token for hint |
| **login_hint** | ⚠️ Extension | ✅ OIDC standard | Both can use, OIDC standardizes it |
| **acr_values** | ❌ Not defined | ✅ OIDC only | Authentication context |
| **claims** | ❌ Not defined | ✅ OIDC only | Structured claim requests |
| **claims_locales** | ❌ Not defined | ✅ OIDC only | Claim language preference |
| **audience** | ✅ Extension | ✅ Extension | Both support (not in core specs) |
| **resource** | ✅ RFC 8707 | ✅ RFC 8707 | Resource indicators (both) |
| **request** | ✅ RFC 9101 | ✅ RFC 9101 | JAR (both) |
| **request_uri** | ✅ RFC 9126 | ✅ RFC 9126 | PAR (both) |

---

## 🎯 **Parameters We Just Added**

### **1. `display` Parameter**
- **Status:** ✅ **IMPLEMENTED**
- **Applies To:** OIDC only
- **Flows:** Authorization Code (OIDC), Implicit (OIDC), Hybrid
- **NOT for:** OAuth flows, Device flows
- **Component:** `DisplayParameterSelector`
- **Service:** `DisplayParameterService`

### **2. `claims` Parameter**
- **Status:** ✅ **IMPLEMENTED**
- **Applies To:** 
  - ✅ **OIDC** (full support - ID token + UserInfo)
  - ⚠️ **OAuth** (limited - only if provider supports UserInfo-like endpoint)
- **Flows:** All Authorization Code, Implicit, Hybrid (both OAuth & OIDC)
- **NOT for:** Device flows (scope-based), Client Credentials
- **Component:** `ClaimsRequestBuilder`
- **Service:** `ClaimsRequestService`

**Why Claims Can Work for OAuth:**
- While not in OAuth 2.0 spec, many OAuth providers support UserInfo-like endpoints
- Claims parameter can specify what user data to return
- Educational value: Shows how OIDC extends OAuth

---

## 🔧 **Which New Features Apply to OAuth V6 Flows?**

### **✅ CAN Add to OAuth V6 Flows:**

#### **1. Claims Request Builder** 
- **Applicability:** OAuth Authorization Code Flow
- **Why:** If provider has UserInfo endpoint
- **Educational Value:** HIGH - Shows OAuth→OIDC evolution
- **Status:** ✅ Component built, can add to OAuth flows

#### **2. Audience Parameter**
- **Applicability:** ALL OAuth flows
- **Why:** Specify target API for tokens
- **Educational Value:** HIGH - Critical for API authorization
- **Status:** ⚠️ Type defined, need UI

#### **3. Resource Parameter (RFC 8707)**
- **Applicability:** ALL OAuth flows
- **Why:** Specify target resources
- **Educational Value:** MEDIUM
- **Status:** ❌ Not implemented

#### **4. Enhanced Prompt (login_hint)**
- **Applicability:** OAuth Authorization Code, Implicit
- **Why:** UX improvement (pre-fill username)
- **Educational Value:** MEDIUM
- **Status:** ✅ Supported in types

---

### **❌ CANNOT Add to OAuth V6 Flows:**

1. **display** - OIDC-specific (no OAuth spec)
2. **nonce** - OIDC-specific (ID token protection)
3. **max_age** - OIDC-specific (session management)
4. **ui_locales** - OIDC-specific
5. **claims_locales** - OIDC-specific
6. **id_token_hint** - OIDC-specific (no ID tokens in OAuth)
7. **acr_values** - OIDC-specific (authentication context)

---

## 📝 **OAuth V6 Enhancement Recommendations**

### **Priority 1: High Value for OAuth**

#### **Add to OAuth Authorization Code Flow V6:**
1. ✅ **Claims Request Builder**
   - Show with note: "Works if provider supports UserInfo endpoint"
   - Educational about OAuth→OIDC evolution
   
2. ❌ **Audience Parameter**
   - Essential for API-specific tokens
   - Text input with validation
   - Example: `https://api.example.com`

3. ❌ **login_hint Parameter**
   - Pre-fill username/email
   - UX improvement
   - Already supported, needs UI

### **Priority 2: Medium Value**

4. ❌ **Resource Indicators**
   - RFC 8707 support
   - Multiple resource targeting
   
5. ❌ **PAR Integration**
   - We have PAR support
   - Need to integrate with OAuth flows

---

## 🗂️ **Mock Flows - What Can They Use?**

### **Mock OAuth Flows Should Support:**
- ✅ All core OAuth parameters (response_type, client_id, scope, state)
- ✅ PKCE (code_challenge, code_challenge_method)
- ✅ Claims builder (if showing UserInfo)
- ✅ Audience parameter
- ✅ Resource indicators
- ✅ login_hint
- ❌ NO OIDC-specific parameters

### **Mock OIDC Flows Should Support:**
- ✅ All OAuth parameters
- ✅ All OIDC parameters (nonce, display, claims, etc.)
- ✅ Full claims request builder
- ✅ Display parameter

---

## 📋 **Action Items for Complete Coverage**

### **For OAuth V6 Flows:**
- [ ] Add Claims Request Builder to OAuthAuthorizationCodeFlowV6
- [ ] Add Audience parameter input to all OAuth flows
- [ ] Add Resource parameter input to all OAuth flows
- [ ] Add login_hint UI to OAuth flows
- [ ] Enhanced educational content showing OAuth vs OIDC differences

### **For OIDC V6 Flows:**
- [x] Display parameter - ✅ DONE
- [x] Claims request builder - ✅ DONE
- [ ] ui_locales parameter
- [ ] claims_locales parameter
- [ ] Connect display & claims to auth URL generation

### **For Mock Flows:**
- [ ] Determine which mock flows exist
- [ ] Add appropriate parameters based on flow type (OAuth vs OIDC)
- [ ] Ensure educational notes about applicability

---

## 🎓 **Educational Opportunities**

### **Show Users:**
1. **OAuth→OIDC Evolution**
   - Claims started as extension, became OIDC standard
   - audience/resource work in both
   - Display/nonce are OIDC innovations

2. **When to Use What:**
   - OAuth: API authorization only
   - OIDC: User authentication + API authorization
   - Parameter choice reflects use case

3. **Provider Variations:**
   - Not all providers support all parameters
   - OIDC providers MUST support OIDC parameters
   - OAuth providers MAY support OIDC-like features

---

## 📊 **Summary Table: What Goes Where**

| Flow Type | display | claims | nonce | audience | resource | login_hint |
|-----------|---------|--------|-------|----------|----------|------------|
| **OAuth Auth Code V6** | ❌ | ⚠️* | ❌ | ✅ | ✅ | ✅ |
| **OAuth Implicit V6** | ❌ | ⚠️* | ❌ | ✅ | ✅ | ✅ |
| **OAuth Client Creds V6** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **OAuth Device V6** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **OIDC Auth Code V6** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OIDC Implicit V6** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OIDC Hybrid V6** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OIDC Device V6** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

*Claims can work for OAuth if provider has UserInfo-like endpoint

---

## ✅ **Conclusion**

**Current Status:**
- ✅ OIDC V6 flows: Display & Claims added
- ⚠️ OAuth V6 flows: Can add Claims (educational) + Audience
- 📝 Mock flows: Need assessment and parameter addition

**Next Steps:**
1. Add claims builder to OAuth Authorization Code flow (with education)
2. Add audience parameter to all OAuth flows
3. Document mock flow requirements
4. Create migration guide for remaining flows

