# Token Operations Quick Reference Card

**Quick guide for developers** - When can I introspect tokens and call UserInfo?

---

## 🎯 Quick Decision Tree

### Can I introspect access tokens?
✅ **YES** - Almost always (except public clients need authentication)

### Can I introspect refresh tokens?
✅ **YES** - If your flow issues refresh tokens

### Can I introspect ID tokens?
❌ **NO** - Validate them locally instead

### Can I call UserInfo?
✅ **YES** - If you have `openid` scope AND a user (not client_credentials)  
❌ **NO** - If no `openid` scope OR no user

---

## 📋 Flow Cheat Sheet

| Flow | AT | RT | UserInfo | Key Rule |
|------|----|----|----------|----------|
| Auth Code | ✅ | ✅ | ❓ | Need `openid` for UserInfo |
| Implicit | ✅ | ❌ | ❓ | No RT; need `openid` for UserInfo |
| Hybrid | ✅ | ✅ | ✅ | Always OIDC |
| Client Creds | ✅ | ❌ | ❌ | No user = no UserInfo |
| Device Code | ✅ | ✅ | ❓ | Need `openid` for UserInfo |
| ROPC | ✅ | ✅ | ❓ | Need `openid` for UserInfo |

**Legend:**
- AT = Access Token
- RT = Refresh Token
- ❓ = Depends on `openid` scope

---

## 🔑 Key Rules

### Token Introspection (RFC 7662)
1. ✅ Access tokens → YES
2. ✅ Refresh tokens → YES (if issued)
3. ❌ ID tokens → NO (validate locally)
4. ⚠️ Requires client authentication (public clients can't introspect)

### UserInfo Endpoint (OIDC)
1. ✅ Requires `openid` scope
2. ✅ Use access token (not ID or refresh token)
3. ✅ Only for user-bound tokens
4. ❌ Not for client_credentials (no user)

---

## 🚨 Common Mistakes

### ❌ DON'T
- Introspect ID tokens
- Call UserInfo without `openid` scope
- Call UserInfo with client_credentials
- Use ID token at UserInfo endpoint
- Use refresh token at UserInfo endpoint
- Introspect on every API call (use caching)

### ✅ DO
- Introspect access tokens for validation
- Call UserInfo with access token + `openid`
- Validate ID tokens locally
- Cache introspection results
- Use proper client authentication

---

## 💡 When to Use What

### Use Token Introspection When:
- Verifying opaque access tokens
- Checking if token is revoked
- Getting token metadata (scopes, expiry)
- Centralized policy enforcement

### Use UserInfo When:
- Need user profile claims
- Want real-time user data
- ID token too large
- Centralized profile management

### Validate ID Token Locally When:
- You have the signing key
- Token is a JWT
- You want fast validation
- No network call needed

---

## 🎓 Educational Modal

Click **"What can I do?"** button in the UI to see:
- Flow-specific rules
- Visual indicators (✅/❌)
- Detailed explanations
- Common mistakes to avoid

---

## 📚 Learn More

- `TOKEN_OPERATIONS_EDUCATION_V8.md` - Full documentation
- [RFC 7662](https://tools.ietf.org/html/rfc7662) - Token Introspection
- [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html) - UserInfo

---

**Last Updated:** 2024-11-21  
**Version:** V8  
**Print this card and keep it handy!** 📌
