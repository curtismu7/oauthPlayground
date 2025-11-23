# Token Operations Education System (V8)

**Date:** 2024-11-21  
**Feature:** Educational modals for token introspection and UserInfo  
**Status:** ✅ Complete

---

## Overview

Added an educational system that teaches users when they can use token introspection and the UserInfo endpoint, based on OAuth 2.0 and OIDC standards (RFC 7662 and OIDC Core).

---

## What Was Added

### 1. Token Operations Service (`tokenOperationsServiceV8.ts`)

A service that determines which token operations are allowed for each flow type:

**Features:**
- ✅ Flow-specific rules for introspection and UserInfo
- ✅ Checks for `openid` scope presence
- ✅ Educational explanations for each operation
- ✅ Reasons why operations are/aren't available

**Example:**
```typescript
const rules = TokenOperationsServiceV8.getOperationRules('oauth-authz', 'openid profile');
// Returns:
// {
//   canIntrospectAccessToken: true,
//   canIntrospectRefreshToken: true,
//   canCallUserInfo: true,
//   userInfoReason: 'UserInfo available because openid scope is present',
//   ...
// }
```

### 2. Educational Modal (`TokenOperationsEducationModalV8.tsx`)

A beautiful, user-friendly modal that explains:
- What you can do with your current flow
- Why certain operations are/aren't available
- When to use introspection vs UserInfo
- Common mistakes to avoid

**Design Features:**
- ✅ Light backgrounds with dark text (accessibility compliant)
- ✅ Visual indicators (✅/❌) for allowed operations
- ✅ Flow-specific content
- ✅ Simple, jargon-free explanations
- ✅ Keyboard accessible (Escape to close)

### 3. Integration with UnifiedFlowSteps

**Help Icons:**
- Added "What can I do?" buttons to UserInfo and Introspection sections
- Clicking opens the educational modal
- Shows flow-specific rules

**Validation:**
- Checks if operations are allowed before executing
- Shows helpful error messages if not allowed
- Prevents invalid API calls

---

## Flow-by-Flow Rules

### Authorization Code (Pure OAuth)
- ✅ Introspect Access Token
- ✅ Introspect Refresh Token
- ❌ UserInfo (no `openid` scope)

### Authorization Code + OIDC (`openid`)
- ✅ Introspect Access Token
- ✅ Introspect Refresh Token
- ✅ UserInfo

### Implicit Flow (Pure OAuth)
- ✅ Introspect Access Token
- ❌ Introspect Refresh Token (not issued)
- ❌ UserInfo (no `openid` scope)

### Implicit + OIDC (`openid`)
- ✅ Introspect Access Token
- ❌ Introspect Refresh Token (not issued)
- ✅ UserInfo

### Hybrid Flow (Always OIDC)
- ✅ Introspect Access Token
- ✅ Introspect Refresh Token
- ✅ UserInfo

### Client Credentials
- ✅ Introspect Access Token
- ❌ Introspect Refresh Token (rarely used)
- ❌ UserInfo (no user, only client)

### Device Code (Pure OAuth)
- ✅ Introspect Access Token
- ✅ Introspect Refresh Token
- ❌ UserInfo (no `openid` scope)

### Device Code + OIDC (`openid`)
- ✅ Introspect Access Token
- ✅ Introspect Refresh Token
- ✅ UserInfo

### ROPC (Pure OAuth)
- ✅ Introspect Access Token
- ✅ Introspect Refresh Token
- ❌ UserInfo (no `openid` scope)

### ROPC + OIDC (`openid`)
- ✅ Introspect Access Token
- ✅ Introspect Refresh Token
- ✅ UserInfo

---

## User Experience

### Before
```
User clicks "Introspect Token"
❌ Error: invalid_client - Unsupported authentication method
User: "What does this mean? 😕"
```

### After
```
User clicks "What can I do?" button
📚 Modal opens with clear explanation:
  ✅ Introspect Access Token - You can introspect access tokens
  ❌ UserInfo - Not available because openid scope not requested
  
User clicks "Introspect Token"
✅ Clear message: "Token introspection requires client authentication..."
User: "Ah, I understand! 😊"
```

---

## Educational Content

### Token Introspection

**What it is:**
> A back-channel call to the authorization server asking: "Is this token still valid, and what are its properties?"

**When to use:**
- Resource servers need to verify opaque access tokens
- You want centralized revocation checking (even for JWTs)
- You need to check token scopes and permissions
- You want to verify token is still active (not revoked)

**Common mistakes:**
- ❌ Introspecting ID tokens (validate them locally instead)
- ❌ Introspecting tokens on every API call (use caching)
- ❌ Using introspection for public clients without authentication
- ❌ Exposing introspection endpoint to untrusted clients

### UserInfo Endpoint

**What it is:**
> The UserInfo endpoint returns claims about the authenticated end-user. It requires an access token issued with the "openid" scope.

**When to use:**
- You need additional user profile claims beyond the ID token
- You want centralized profile management
- Your ID token is too large and you want to fetch claims on-demand
- You need real-time user data (not cached in ID token)

**Common mistakes:**
- ❌ Calling UserInfo without "openid" scope
- ❌ Using ID token instead of access token
- ❌ Calling UserInfo for client_credentials flow (no user)
- ❌ Calling UserInfo with refresh token

---

## Implementation Details

### Service Layer

**TokenOperationsServiceV8:**
```typescript
// Check if operation is allowed
const canIntrospect = TokenOperationsServiceV8.isOperationAllowed(
  'oauth-authz',
  'openid profile',
  'introspect-access'
);

// Get detailed rules
const rules = TokenOperationsServiceV8.getOperationRules(
  'oauth-authz',
  'openid profile'
);

// Get educational content
const content = TokenOperationsServiceV8.getEducationalContent('introspection');
```

### Component Integration

**UnifiedFlowSteps.tsx:**
```typescript
// State for modal
const [showTokenOperationsModal, setShowTokenOperationsModal] = useState(false);

// Validation before introspection
const canIntrospect = TokenOperationsServiceV8.isOperationAllowed(
  flowType,
  credentials.scopes,
  'introspect-access'
);

if (!canIntrospect) {
  // Show helpful error message
  const rules = TokenOperationsServiceV8.getOperationRules(flowType, credentials.scopes);
  toastV8.error(`Token introspection is not available. ${rules.introspectionReason}`);
  return;
}

// Help button
<button onClick={() => setShowTokenOperationsModal(true)}>
  What can I do?
</button>

// Modal
<TokenOperationsEducationModalV8
  isOpen={showTokenOperationsModal}
  onClose={() => setShowTokenOperationsModal(false)}
  flowType={flowType}
  scopes={credentials.scopes}
/>
```

---

## Standards Compliance

This implementation follows:

### RFC 7662 (Token Introspection)
- ✅ Introspection requires client authentication
- ✅ Access and refresh tokens can be introspected
- ✅ ID tokens should be validated locally, not introspected

### OIDC Core Specification
- ✅ UserInfo requires `openid` scope
- ✅ UserInfo requires access token (not ID token or refresh token)
- ✅ UserInfo only available for user-bound tokens (not client credentials)

### OAuth 2.0 Best Practices
- ✅ Public clients cannot introspect (no authentication)
- ✅ Clear error messages for invalid operations
- ✅ Educational content to prevent common mistakes

---

## Accessibility

### WCAG AA Compliance
- ✅ Dark text on light backgrounds (high contrast)
- ✅ Keyboard navigation (Escape to close)
- ✅ ARIA labels for buttons
- ✅ Focus management
- ✅ Screen reader friendly

### Color Palette
```typescript
// Light backgrounds for dark text
background: '#ffffff'  // White
background: '#f9fafb'  // Light grey
background: '#f0f9ff'  // Light blue
background: '#fef3c7'  // Light yellow

// Dark text on light backgrounds
color: '#1f2937'  // Primary dark text
color: '#0c4a6e'  // Dark blue text
color: '#92400e'  // Dark brown text
```

---

## Testing

### Test Scenarios

**1. Authorization Code without openid:**
- ✅ Can introspect access token
- ✅ Can introspect refresh token
- ❌ Cannot call UserInfo
- ✅ Modal explains why UserInfo is not available

**2. Authorization Code with openid:**
- ✅ Can introspect access token
- ✅ Can introspect refresh token
- ✅ Can call UserInfo
- ✅ Modal shows all operations are available

**3. Client Credentials:**
- ✅ Can introspect access token
- ❌ Cannot call UserInfo
- ✅ Modal explains "no user in this flow"

**4. Device Code with openid:**
- ✅ Can introspect access token
- ✅ Can introspect refresh token
- ✅ Can call UserInfo
- ✅ Modal shows all operations are available

**5. Public Client (clientAuthMethod: none):**
- ❌ Cannot introspect (no authentication)
- ✅ Clear error message explaining why
- ✅ Guidance on how to enable introspection

---

## Files Modified

### New Files
- `src/v8/services/tokenOperationsServiceV8.ts` - Rules engine
- `src/v8/components/TokenOperationsEducationModalV8.tsx` - Educational modal

### Modified Files
- `src/v8u/components/UnifiedFlowSteps.tsx` - Integration and validation

---

## Benefits

### For Users
✅ **Clear Understanding** - Know what operations are available  
✅ **Learn Standards** - Understand OAuth/OIDC best practices  
✅ **Avoid Mistakes** - Prevent common errors  
✅ **Better Debugging** - Helpful error messages  

### For Developers
✅ **Standards Compliant** - Follows RFC 7662 and OIDC Core  
✅ **Maintainable** - Centralized rules in service  
✅ **Extensible** - Easy to add new flows  
✅ **Well Documented** - Clear code and comments  

### For the Product
✅ **Professional** - Polished user experience  
✅ **Educational** - Teaches OAuth/OIDC concepts  
✅ **Accessible** - WCAG AA compliant  
✅ **Consistent** - Follows V8 design patterns  

---

## Future Enhancements

Potential improvements:
- [ ] Add visual flow diagrams showing token lifecycle
- [ ] Add code examples for each operation
- [ ] Add links to RFC specifications
- [ ] Add "Try it" interactive demos
- [ ] Add comparison tables (introspection vs local validation)
- [ ] Add performance considerations
- [ ] Add security best practices section

---

## Related Documentation

- `DEVICE_CODE_INTROSPECTION_FIX.md` - Introspection fix details
- `REDIRECTLESS_SUPPORT_V8U.md` - Redirectless mode documentation
- [RFC 7662](https://tools.ietf.org/html/rfc7662) - Token Introspection
- [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html) - UserInfo Endpoint

---

**Last Updated:** 2024-11-21  
**Version:** V8  
**Status:** ✅ Complete
