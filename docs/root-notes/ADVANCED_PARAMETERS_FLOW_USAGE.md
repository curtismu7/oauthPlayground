# Advanced Parameters - Where Should They Be Used?

## Answer: Single Smart Component

The current `AdvancedParametersV6` component is **smart** - it adapts based on flow type:

```typescript
const isOIDCFlow = actualFlowType.startsWith('oidc');
const isDeviceFlow = actualFlowType.includes('device');
```

### For OAuth Flows:
Shows:
- ✅ Audience Parameter
- ✅ Resources (RFC 8707)
- ✅ Prompt Parameter
- ❌ Claims Request Builder (OIDC only)
- ❌ Display Parameter (OIDC only)

### For OIDC Flows:
Shows:
- ✅ Audience Parameter
- ✅ Resources (RFC 8707)
- ✅ Prompt Parameter (with OIDC extensions)
- ✅ Claims Request Builder (OIDC only)
- ✅ Display Parameter (OIDC only)

### For Device Flows:
Shows:
- ✅ Audience Parameter
- ✅ Claims Request Builder (if OIDC)
- ✅ Display Parameter (if OIDC)
- ❌ Resources (doesn't make sense for device)
- ❌ Prompt (no user interaction in device flow)

---

## Which Flows Should Use Advanced Parameters?

### ✅ YES - Should Use Advanced Parameters

#### 1. **OAuth Authorization Code Flow**
- **Why:** User-interactive flow, supports audience, resources, prompt
- **Parameters:** Audience, Resources, Prompt
- **Route:** `/flows/oauth-authorization-code/advanced-parameters`
- **Storage Key:** `local:oauth-authz-v6:advanced-params`

#### 2. **OIDC Authorization Code Flow** ⭐
- **Why:** User-interactive flow, supports ALL parameters
- **Parameters:** Audience, Resources, Prompt, Display, Claims
- **Route:** `/flows/oidc-authorization-code/advanced-parameters`
- **Storage Key:** `local:oidc-authz-v6:advanced-params`
- **Note:** MOST comprehensive - includes OIDC-specific params

#### 3. **OAuth Implicit Flow**
- **Why:** User-interactive flow, supports audience, resources, prompt
- **Parameters:** Audience, Resources, Prompt
- **Route:** `/flows/oauth-implicit/advanced-parameters`
- **Storage Key:** `local:oauth-implicit-v6:advanced-params`

#### 4. **OIDC Implicit Flow** ⭐
- **Why:** User-interactive flow, supports ALL parameters
- **Parameters:** Audience, Resources, Prompt, Display, Claims
- **Route:** `/flows/oidc-implicit/advanced-parameters`
- **Storage Key:** `local:oidc-implicit-v6:advanced-params`

#### 5. **OAuth Device Authorization Flow** (Limited)
- **Why:** Device flow, but can still use audience
- **Parameters:** Audience only
- **Route:** `/flows/device-authorization/advanced-parameters`
- **Storage Key:** `local:oauth-device-auth-v6:advanced-params`
- **Note:** Resources/Prompt hidden (no user interaction)

#### 6. **OIDC Device Authorization Flow** (Limited)
- **Why:** Device flow with OIDC, can use audience + OIDC params
- **Parameters:** Audience, Display, Claims
- **Route:** `/flows/oidc-device-authorization/advanced-parameters`
- **Storage Key:** `local:oidc-device-auth-v6:advanced-params`
- **Note:** Resources/Prompt hidden

#### 7. **PAR (Pushed Authorization Request) Flow**
- **Why:** Extension of OAuth Authz, supports all OAuth params
- **Parameters:** Audience, Resources, Prompt
- **Route:** `/flows/par/advanced-parameters`
- **Storage Key:** `local:par-v6:advanced-params`

#### 8. **RAR (Rich Authorization Requests) Flow**
- **Why:** Extension of OAuth Authz, supports all OAuth params
- **Parameters:** Audience, Resources, Prompt
- **Route:** `/flows/rar/advanced-parameters`
- **Storage Key:** `local:rar-v6:advanced-params`

---

### ❌ NO - Should NOT Use Advanced Parameters

#### 1. **Client Credentials Flow** ❌
- **Why:** Machine-to-machine, no user interaction
- **Reason:** No prompt, no display, no claims request makes sense
- **Alternative:** Scopes are configured in credentials

#### 2. **JWT Bearer Token Flow** ❌
- **Why:** Mock flow with generated JWT
- **Reason:** Token is constructed manually, not from authorization server
- **Alternative:** JWT builder has its own configuration

#### 3. **SAML Bearer Assertion Flow** ❌
- **Why:** Mock flow with SAML assertion
- **Reason:** Token exchange is direct, no authorization step
- **Alternative:** SAML assertion builder has its own configuration

#### 4. **Redirectless Flow** ❌
- **Why:** Simplified PingOne flow
- **Reason:** Designed to be simple, adding advanced params defeats purpose
- **Alternative:** Keep it simple

---

## Is There an "OIDC Advanced Parameters"?

### Answer: YES and NO

**YES:**
- OIDC flows get **additional parameters** (Display, Claims Request Builder)
- The component automatically shows these when `isOIDCFlow = true`

**NO:**
- It's not a separate component called "OIDC Advanced Parameters"
- It's the **same component** that adapts

### Visual Difference

#### OAuth Flows See:
```
Advanced OAuth Parameters (Optional)
├── Audience Parameter
├── Resource Indicators (RFC 8707)
└── Enhanced Prompt Parameter
```

#### OIDC Flows See:
```
Advanced OAuth Parameters (Optional)  ← Same title!
├── Advanced Claims Request Builder    ← OIDC only
├── Display Parameter (OIDC)           ← OIDC only
├── Audience Parameter
├── Resource Indicators (RFC 8707)
└── Enhanced Prompt Parameter
```

---

## Recommendation: Update Title Based on Flow

### Current Title (Both):
> "Advanced OAuth Parameters (Optional)"

### Proposed Titles:

**For OAuth Flows:**
> "Advanced OAuth Parameters (Optional)"

**For OIDC Flows:**
> "Advanced OIDC Parameters (Optional)"

**Reason:** Makes it clear to users that OIDC flows have additional options

---

## Implementation Checklist

### Currently Implemented:
- ✅ Component adapts to flow type
- ✅ Shows/hides sections based on `isOIDCFlow` and `isDeviceFlow`
- ✅ Save functionality with per-flow storage
- ✅ Auto-loads saved parameters

### TODO:
- [ ] Add link to Advanced Parameters from OAuth Authorization Code flow
- [ ] Add link to Advanced Parameters from OIDC Authorization Code flow
- [ ] Add link to Advanced Parameters from OAuth Implicit flow
- [ ] Add link to Advanced Parameters from OIDC Implicit flow
- [ ] Add link to Advanced Parameters from PAR flow
- [ ] Add link to Advanced Parameters from RAR flow
- [ ] (Optional) Add limited version for Device flows
- [ ] Update title to "Advanced OIDC Parameters" for OIDC flows
- [ ] Test that all parameters actually work with token generation
- [ ] Verify audience appears in token claims
- [ ] Verify resources appear in token claims
- [ ] Verify prompt affects authentication behavior
- [ ] Verify display affects UI presentation (OIDC)
- [ ] Verify claims request is honored (OIDC)

---

## Summary

| Flow Type | Advanced Params? | Parameters Available | Storage Key |
|-----------|-----------------|---------------------|-------------|
| OAuth Authorization Code | ✅ YES | Audience, Resources, Prompt | `local:oauth-authz-v6:advanced-params` |
| OIDC Authorization Code | ✅ YES | Audience, Resources, Prompt, Display, Claims | `local:oidc-authz-v6:advanced-params` |
| OAuth Implicit | ✅ YES | Audience, Resources, Prompt | `local:oauth-implicit-v6:advanced-params` |
| OIDC Implicit | ✅ YES | Audience, Resources, Prompt, Display, Claims | `local:oidc-implicit-v6:advanced-params` |
| OAuth Device Auth | ⚠️ LIMITED | Audience | `local:oauth-device-auth-v6:advanced-params` |
| OIDC Device Auth | ⚠️ LIMITED | Audience, Display, Claims | `local:oidc-device-auth-v6:advanced-params` |
| PAR | ✅ YES | Audience, Resources, Prompt | `local:par-v6:advanced-params` |
| RAR | ✅ YES | Audience, Resources, Prompt | `local:rar-v6:advanced-params` |
| Client Credentials | ❌ NO | - | - |
| JWT Bearer | ❌ NO | - | - |
| SAML Bearer | ❌ NO | - | - |
| Redirectless | ❌ NO | - | - |

---

**Primary Flows:** OAuth & OIDC Authorization Code + Implicit  
**Secondary Flows:** PAR, RAR  
**Limited Support:** Device Authorization  
**Not Applicable:** Client Credentials, JWT Bearer, SAML Bearer, Redirectless

**Total Flows with Advanced Parameters:** 8  
**Flows with Full Support:** 6  
**Flows with Limited Support:** 2  
**Flows without Support:** 4
