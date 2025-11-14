# Features Needing Verification - Ping Product Comparison

**Last Updated:** 2025-11-11  
**Current Verification Status:** 46% (23 of 50+ features verified)

---

## ✅ Already Verified (23 features)

### OAuth 2.0 Core Flows (6/7)
- [x] Authorization Code Flow
- [x] Authorization Code + PKCE
- [x] Implicit Flow
- [x] Client Credentials
- [x] Device Authorization Flow
- [x] Refresh Token
- [ ] **ROPC** - Needs re-verification for PingOne SSO (marked as "none")

### OpenID Connect (5/7)
- [x] OIDC Discovery
- [x] OIDC Dynamic Client Registration
- [x] Hybrid Flow
- [x] Front-Channel Logout
- [x] Back-Channel Logout
- [ ] **OpenID Connect Core** - Needs full verification
- [ ] **Session Management** - Needs verification for "partial" claims

### Advanced OAuth (3/7)
- [x] PAR (Pushed Authorization Requests)
- [x] CIBA (Client-Initiated Backchannel Authentication)
- [x] Token Exchange (RFC 8693)
- [ ] **RAR** - Needs verification for AIC/PingOne claims
- [ ] **JAR** - Needs verification
- [ ] **JWT Bearer Token** - Needs verification
- [ ] **SAML Bearer Token** - Needs verification

### Token Features (4/6)
- [x] Token Introspection (RFC 7662)
- [x] Token Revocation (RFC 7009)
- [x] DPoP (Demonstrating Proof of Possession)
- [x] mTLS (Mutual TLS)
- [ ] **JWT Access Tokens** - Needs verification
- [ ] **Opaque Access Tokens** - Needs verification

### Client Authentication (4/5)
- [x] Client Secret (Basic/Post)
- [x] Client Secret JWT
- [x] Private Key JWT
- [x] Public Clients (none)
- [ ] **mTLS Client Authentication** - Needs verification (different from token mTLS)

### Security Features (0/7)
- [ ] **PKCE** - Needs verification (separate from Auth Code + PKCE)
- [ ] **State Parameter** - Needs verification
- [ ] **Nonce Parameter** - Needs verification
- [ ] **Request Object Encryption** - Needs verification
- [ ] **ID Token Encryption** - Needs verification
- [ ] **FAPI 1.0 Advanced** - Needs verification
- [ ] **FAPI 2.0** - Already marked as "none" for PF, needs AIC/PingOne verification

### Specialized Features (0/7)
- [ ] **Step-Up Authentication** - Needs verification
- [ ] **Consent Management** - Needs verification
- [ ] **Custom Scopes** - Needs verification
- [ ] **Custom Claims** - Needs verification
- [ ] **Token Lifetime Policies** - Needs verification
- [ ] **Adaptive Authentication** - Needs verification
- [ ] **Passwordless Authentication** - Needs verification

---

## 🔍 Priority 1: High-Impact Features (Need Immediate Verification)

### 1. RAR (Rich Authorization Requests) - RFC 9396
**Current Status:**
- PingFederate: `none` ✅ (verified - no support in 12.2)
- PingOne AIC: `full` ⚠️ (UNVERIFIED)
- PingOne SSO: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Does AIC support RAR natively?
- [ ] Does PingOne SSO support RAR?
- [ ] What's the implementation method?
- [ ] Are there limitations?

**Documentation to Check:**
- PingOne AIC OAuth docs
- PingOne Platform API docs
- Look for "authorization_details" parameter support

---

### 2. JAR (JWT Secured Authorization Request) - RFC 9101
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] PingFederate: Signed request objects support?
- [ ] AIC: Request object encryption?
- [ ] PingOne SSO: JAR endpoint availability?
- [ ] Which signing algorithms supported?

**Documentation to Check:**
- Look for "request" parameter support
- Check for request_uri support
- Verify encryption capabilities

---

### 3. JWT Bearer Token (RFC 7523)
**Current Status:**
- PingFederate: `full` ⚠️ (UNVERIFIED)
- PingOne AIC: `full` ⚠️ (UNVERIFIED)
- PingOne SSO: `partial` ⚠️ (via custom grant types)

**What to Verify:**
- [ ] PingFederate: Native JWT bearer grant?
- [ ] AIC: JWT assertion support?
- [ ] PingOne: Custom grant configuration required?
- [ ] Supported JWT signing algorithms?

---

### 4. SAML Bearer Token (RFC 7522)
**Current Status:**
- PingFederate: `full` ⚠️ (UNVERIFIED)
- PingOne AIC: `partial` ⚠️ (limited SAML integration)
- PingOne SSO: `none` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] PingFederate: SAML assertion to OAuth token exchange?
- [ ] AIC: SAML integration capabilities?
- [ ] PingOne: Any SAML bearer support?
- [ ] Configuration requirements?

---

### 5. FAPI 1.0 Advanced
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] PingFederate: FAPI 1.0 certification?
- [ ] AIC: FAPI compliance?
- [ ] PingOne: FAPI support?
- [ ] Which FAPI profiles supported?

**Documentation to Check:**
- OpenID Foundation certification page
- Product security compliance docs
- FAPI implementation guides

---

### 6. FAPI 2.0
**Current Status:**
- PingFederate: `none` ✅ (verified - not in 12.2)
- PingOne AIC: `full` ⚠️ (UNVERIFIED)
- PingOne SSO: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] AIC: FAPI 2.0 certification status?
- [ ] PingOne: FAPI 2.0 support?
- [ ] Implementation completeness?

---

## 🔍 Priority 2: Security Features (Need Verification)

### 7. PKCE (as standalone security feature)
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED as standalone)

**What to Verify:**
- [ ] Can PKCE be enforced globally?
- [ ] Per-client PKCE configuration?
- [ ] Support for both S256 and plain?
- [ ] PKCE required for public clients?

---

### 8. State Parameter
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] State parameter validation?
- [ ] Required or optional?
- [ ] CSRF protection implementation?

---

### 9. Nonce Parameter
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Nonce validation in ID tokens?
- [ ] Required for implicit/hybrid flows?
- [ ] Replay attack prevention?

---

### 10. Request Object Encryption
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] JWE support for request objects?
- [ ] Supported encryption algorithms?
- [ ] Key management?

---

### 11. ID Token Encryption
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] JWE support for ID tokens?
- [ ] Per-client encryption configuration?
- [ ] Supported algorithms?

---

## 🔍 Priority 3: Specialized Features (Need Verification)

### 12. Step-Up Authentication
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] ACR (Authentication Context Class Reference) support?
- [ ] AMR (Authentication Methods Reference) support?
- [ ] Step-up flow implementation?
- [ ] Integration with MFA?

---

### 13. Consent Management
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Consent screen customization?
- [ ] Consent revocation API?
- [ ] Consent history tracking?
- [ ] Granular consent per scope?

---

### 14. Custom Scopes
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] How to define custom scopes?
- [ ] Scope-to-claim mapping?
- [ ] Dynamic scope registration?
- [ ] Scope validation?

---

### 15. Custom Claims
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Custom claim injection in tokens?
- [ ] Claim mapping from user attributes?
- [ ] Scripting/policy support?
- [ ] Claim transformation?

---

### 16. Token Lifetime Policies
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Configurable access token lifetime?
- [ ] Configurable refresh token lifetime?
- [ ] Per-client token policies?
- [ ] Sliding window refresh tokens?

---

### 17. Adaptive Authentication
**Current Status:**
- PingFederate: `plugin` ⚠️ (via PingOne Risk)
- PingOne AIC: `full` ⚠️ (UNVERIFIED)
- PingOne SSO: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] PingFederate: PingOne Risk integration details?
- [ ] AIC: Native risk-based auth?
- [ ] PingOne: PingOne Protect integration?
- [ ] Risk signals available?

---

### 18. Passwordless Authentication
**Current Status:**
- PingFederate: `plugin` ⚠️ (via integrations)
- PingOne AIC: `full` ⚠️ (UNVERIFIED)
- PingOne SSO: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] WebAuthn/FIDO2 support?
- [ ] Magic link support?
- [ ] Biometric authentication?
- [ ] Passkey support?
- [ ] Configuration requirements?

---

## 🔍 Priority 4: Token Features (Need Verification)

### 19. JWT Access Tokens
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Self-contained JWT access tokens?
- [ ] Signing algorithms supported?
- [ ] Custom claims in access tokens?
- [ ] Token introspection still available?

---

### 20. Opaque Access Tokens
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Reference token support?
- [ ] Token storage mechanism?
- [ ] Introspection required?
- [ ] Performance considerations?

---

### 21. mTLS Client Authentication
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Certificate-based client auth?
- [ ] Self-signed cert support?
- [ ] CA cert validation?
- [ ] Certificate revocation checking?

---

### 22. Self-Signed Certificate
**Current Status:**
- All products: `full` ⚠️ (UNVERIFIED)

**What to Verify:**
- [ ] Self-signed cert acceptance?
- [ ] Certificate pinning?
- [ ] Trust store configuration?

---

## 📋 Verification Checklist Template

For each feature, verify:

```markdown
### Feature Name

**Product:** [PingFederate | PingOne AIC | PingOne SSO]

**Verification Date:** YYYY-MM-DD

**Documentation Source:**
- [ ] Official product documentation URL
- [ ] Version number
- [ ] Specific page/section

**Support Level:** [Full | Partial | Plugin | None]

**Notes:**
- What's supported?
- What's not supported?
- Configuration requirements?
- Limitations?
- Prerequisites?

**Test Results:** (if applicable)
- [ ] Feature tested in sandbox
- [ ] Configuration steps documented
- [ ] Limitations confirmed

**Verification Status:** ✅ Verified | ⚠️ Needs Review | ❌ Not Supported
```

---

## 📊 Summary Statistics

**Total Features:** 50+

**Verified:** 23 (46%)
- OAuth 2.0 Core: 6/7 (86%)
- OpenID Connect: 5/7 (71%)
- Advanced OAuth: 3/7 (43%)
- Token Features: 4/6 (67%)
- Client Authentication: 4/5 (80%)
- Security Features: 0/7 (0%)
- Specialized Features: 0/7 (0%)

**Unverified:** 27+ (54%)

**Priority Breakdown:**
- 🔴 High Priority: 6 features
- 🟡 Medium Priority: 5 features
- 🟢 Low Priority: 16+ features

---

## 🎯 Recommended Verification Order

1. **Week 1:** High-impact features (RAR, JAR, JWT Bearer, SAML Bearer, FAPI)
2. **Week 2:** Security features (PKCE, State, Nonce, Encryption)
3. **Week 3:** Specialized features (Step-up, Consent, Custom scopes/claims)
4. **Week 4:** Remaining token features and authentication methods

---

## 📚 Documentation Resources

### PingFederate
- Developer's Reference Guide: https://docs.pingidentity.com/pingfederate
- OAuth 2.0 endpoints documentation
- Version: 12.2+

### PingOne AIC
- OAuth & OIDC docs: https://backstage.forgerock.com/docs/am
- Authorization services
- Identity Gateway integration

### PingOne SSO
- Platform API docs: https://apidocs.pingidentity.com/pingone/platform/v1/api/
- OIDC/OAuth documentation
- Authentication policies

---

## ✅ Next Steps

1. **Prioritize** high-impact features (RAR, JAR, FAPI)
2. **Access** official documentation for each product
3. **Test** features in sandbox environments when possible
4. **Document** findings with version numbers and sources
5. **Update** comparison page with verified information
6. **Track** verification progress in this document

---

*This checklist will be updated as features are verified.*
