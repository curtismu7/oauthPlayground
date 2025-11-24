# V8U All Flows Implementation Plan

**Goal:** Build V8U as a unified flow that handles **ALL** OAuth/OIDC flow types, then split into individual flows later.

---

## Flow Types to Support

Based on `SpecVersionServiceV8`, V8U needs to support:

1. ✅ **oauth-authz** - Authorization Code Flow
2. ✅ **implicit** - Implicit Flow  
3. ✅ **client-credentials** - Client Credentials Flow
4. ✅ **ropc** - Resource Owner Password Credentials
5. ✅ **device-code** - Device Authorization Flow
6. ✅ **hybrid** - Hybrid Flow

---

## Current Status

### ✅ Already Implemented in V8
- **Authorization Code**: `OAuthIntegrationServiceV8` ✅
- **Implicit**: `ImplicitFlowIntegrationServiceV8` ✅
- **Client Credentials**: `ClientCredentialsIntegrationServiceV8` ✅
- **Device Code**: `DeviceCodeIntegrationServiceV8` ✅
- **ROPC**: `ROPCIntegrationServiceV8` ✅
- **Hybrid**: `HybridFlowIntegrationServiceV8` ✅

### ❌ Need to Implement
- None! All integration services are implemented.

---

## Implementation Phases

### Phase 1: Build Missing Integration Services (V8) - ✅ COMPLETE

Create V8 integration services for missing flows (these will be used by V8U):

1. **ClientCredentialsIntegrationServiceV8**
   - Token endpoint: `POST /{env}/as/token`
   - Grant type: `client_credentials`
   - Uses: `client_id`, `client_secret`, `scope`

2. **DeviceCodeIntegrationServiceV8**
   - Device authorization: `POST /{env}/as/device_authorization`
   - Token endpoint: `POST /{env}/as/token` (with `device_code`)
   - Grant type: `urn:ietf:params:oauth:grant-type:device_code`

3. **ROPCIntegrationServiceV8**
   - Token endpoint: `POST /{env}/as/token`
   - Grant type: `password`
   - Uses: `client_id`, `client_secret`, `username`, `password`, `scope`

4. **HybridFlowIntegrationServiceV8**
   - Authorization URL: Like authz code + OIDC
   - Response types: `code id_token`, `code token`, `code token id_token`
   - Token endpoint: Exchange code for tokens

**Files to create:**
- `src/v8/services/clientCredentialsIntegrationServiceV8.ts`
- `src/v8/services/deviceCodeIntegrationServiceV8.ts`
- `src/v8/services/ropcIntegrationServiceV8.ts`
- `src/v8/services/hybridFlowIntegrationServiceV8.ts`

---

### Phase 2: Extend V8U Unified Flow Integration - ✅ COMPLETE

Update `unifiedFlowIntegrationV8U.ts` to delegate to all flow integration services:

```typescript
static generateAuthorizationUrl(
  specVersion: SpecVersion,
  flowType: FlowType,
  credentials: UnifiedFlowCredentials
) {
  switch (flowType) {
    case 'oauth-authz':
    case 'hybrid':
      return OAuthIntegrationServiceV8.generateAuthorizationUrl(...);
    case 'implicit':
      return ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(...);
    case 'device-code':
      return DeviceCodeIntegrationServiceV8.requestDeviceAuthorization(...);
    case 'client-credentials':
      return ClientCredentialsIntegrationServiceV8.requestToken(...);
    case 'ropc':
      return ROPCIntegrationServiceV8.requestToken(...);
  }
}
```

---

### Phase 3: Build V8U Unified Flow UI - ✅ COMPLETE

Extend `UnifiedOAuthFlowV8U.tsx` to:

1. **Show flow-specific steps** based on selected flow type:
   - Authorization Code: Credentials → Auth URL → Callback → Tokens
   - Implicit: Credentials → Auth URL → Fragment → Tokens
   - Client Credentials: Credentials → Token Request → Tokens
   - Device Code: Credentials → Device Auth → User Code → Tokens
   - ROPC: Credentials → Username/Password → Token Request → Tokens
   - Hybrid: Credentials → Auth URL → Callback → Tokens

2. **Handle flow-specific UI elements**:
   - Client Credentials: No redirect URI needed
   - Device Code: Show device code, user code, verification URI
   - ROPC: Show username/password fields
   - Hybrid: Show multiple response types

3. **Integrate all flow execution**:
   - Authorization URL generation
   - Token exchange
   - UserInfo calls
   - Token introspection

---

### Phase 4: Test All Flows

Test V8U with:
- [ ] OAuth 2.0 + Authorization Code
- [ ] OAuth 2.0 + Implicit
- [ ] OAuth 2.0 + Client Credentials
- [ ] OAuth 2.0 + ROPC
- [ ] OAuth 2.0 + Device Code
- [ ] OAuth 2.1 + Authorization Code (PKCE required)
- [ ] OAuth 2.1 + Client Credentials
- [ ] OAuth 2.1 + Device Code
- [ ] OIDC + Authorization Code
- [ ] OIDC + Implicit
- [ ] OIDC + Hybrid
- [ ] OIDC + Device Code

---

### Phase 5: Split into Individual Flows (Later)

Once V8U works for all flows, split it into:

- `ImplicitFlowV8U.tsx` - Just implicit flow
- `ClientCredentialsFlowV8U.tsx` - Just client credentials
- `DeviceCodeFlowV8U.tsx` - Just device code
- `ROPCFlowV8U.tsx` - Just ROPC
- `HybridFlowV8U.tsx` - Just hybrid
- `AuthorizationCodeFlowV8U.tsx` - Just authorization code

Each individual flow will:
- Use the same V8U integration services
- Use the same V8U components
- Reuse the unified logic from `UnifiedOAuthFlowV8U`

---

## File Structure

```
src/v8/services/
├── oauthIntegrationServiceV8.ts ✅
├── implicitFlowIntegrationServiceV8.ts ✅
├── clientCredentialsIntegrationServiceV8.ts ✅
├── deviceCodeIntegrationServiceV8.ts ✅
├── ropcIntegrationServiceV8.ts ✅
└── hybridFlowIntegrationServiceV8.ts ✅

src/v8u/
├── flows/
│   └── UnifiedOAuthFlowV8U.tsx ✅
├── components/
│   ├── SpecVersionSelector.tsx ✅
│   ├── FlowTypeSelector.tsx ✅
│   └── UnifiedFlowSteps.tsx ✅
└── services/
    └── unifiedFlowIntegrationV8U.ts ✅
```

---

## Next Steps

1. **Priority 1:** Verify and Test all flows in V8U (Verification Phase)
2. **Priority 2:** Polish UI/UX for new flows if needed
3. **Priority 3:** Split into individual flows (later)

---

**Last Updated:** 2024-11-16

