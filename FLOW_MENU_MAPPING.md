# OAuth Playground - Flow Menu Mapping

## Active V5 Flows (In Menu - Keep These)

### OAuth 2.0 Flows
| Menu Name | Route | Component File | Status |
|-----------|-------|----------------|--------|
| OAuth 2.0 Authorization Code V5 | `/flows/oauth-authorization-code-v5` | `OAuthAuthorizationCodeFlowV5.tsx` | ✅ V5 - KEEP |
| OAuth 2.0 Implicit Flow V5 | `/flows/oauth-implicit-v5` | `OAuthImplicitFlowV5.tsx` | ✅ V5 - KEEP |
| OAuth Device Authorization Code V5 | `/flows/device-authorization-v5` | `DeviceAuthorizationFlowV5.tsx` | ✅ V5 - KEEP |
| OAuth Client Credentials V5 | `/flows/client-credentials-v5` | `ClientCredentialsFlowV5.tsx` | ✅ V5 - KEEP |
| OAuth Resource Owner Password V5 | `/flows/oauth2-resource-owner-password` | `OAuth2ResourceOwnerPasswordFlow.tsx` | ✅ V5 - KEEP (deprecated but in menu) |

### OpenID Connect Flows
| Menu Name | Route | Component File | Status |
|-----------|-------|----------------|--------|
| OIDC Authorization Code V5 | `/flows/oidc-authorization-code-v5` | `OIDCAuthorizationCodeFlowV5.tsx` | ✅ V5 - KEEP |
| OIDC Implicit Flow V5 | `/flows/oidc-implicit-v5` | `OIDCImplicitFlowV5.tsx` | ✅ V5 - KEEP |
| OIDC Device Authorization Code V5 | `/flows/oidc-device-authorization-v5` | `OIDCDeviceAuthorizationFlowV5.tsx` | ✅ V5 - KEEP |
| OIDC Hybrid V5 | `/flows/hybrid-v5` | `OIDCHybridFlowV5.tsx` | ✅ V5 - KEEP |

### Unsupported by PingOne (In Menu - Keep These)
| Menu Name | Route | Component File | Status |
|-----------|-------|----------------|--------|
| OIDC Resource Owner Password | `/oidc/resource-owner-password` | `OIDCResourceOwnerPasswordFlow.tsx` | ⚠️ KEEP (in menu) |
| OAuth 2.0 JWT Bearer | `/flows-old/jwt-bearer` | `JWTBearerFlow.tsx` | ⚠️ KEEP (in menu) |
| OIDC CIBA Flow (Educational) | `/flows/ciba-v5` | `CIBAFlowV5.tsx` | ✅ V5 - KEEP |

### PingOne Tokens
| Menu Name | Route | Component File | Status |
|-----------|-------|----------------|--------|
| PingOne Worker Token V5 | `/flows/worker-token-v5` | `WorkerTokenFlowV5.tsx` | ✅ V5 - KEEP |
| PingOne PAR Flow V5 | `/flows/pingone-par-v5` | `PingOnePARFlowV5.tsx` | ✅ V5 - KEEP |
| Redirectless Flow V5 (Educational) | `/flows/redirectless-flow-mock` | `RedirectlessFlowV5.tsx` | ✅ V5 - KEEP |
| Redirectless Flow V5 (Real) | `/flows/redirectless-flow-v5` | `RedirectlessFlowV5Real.tsx` | ✅ V5 - KEEP |

---

## V2/V3/V4 Flows (NOT in Menu - Candidates for Backup)

### V4 Flows
| Component File | Route | Status |
|----------------|-------|--------|
| `AuthorizationCodeFlowV4.tsx` | N/A | ❌ BACKUP - Not in menu |
| `AuthzV4NewWindsurfFlow.tsx` | `/flows/authz-v4-new-windsurf` | ❌ BACKUP - Routed but not in menu |

### V3 Flows
| Component File | Route | Status |
|----------------|-------|--------|
| `OAuth2ImplicitFlowV3.tsx` | `/flows/oauth2-implicit-v3` | ❌ BACKUP - Routed but not in menu |
| `OIDCImplicitFlowV3.tsx` | `/flows/oidc-implicit-v3` | ❌ BACKUP - Routed but not in menu |
| `OIDCHybridFlowV3.tsx` | `/flows/oidc-hybrid-v3` | ❌ BACKUP - Routed but not in menu |
| `OAuth2ClientCredentialsFlowV3.tsx` | `/flows/oauth2-client-credentials-v3` | ❌ BACKUP - Routed but not in menu |
| `OIDCClientCredentialsFlowV3.tsx` | `/flows/oidc-client-credentials-v3` | ❌ BACKUP - Routed but not in menu |
| `WorkerTokenFlowV3.tsx` | `/flows/worker-token-v3` | ❌ BACKUP - Routed but not in menu |

### V2 Flows
| Component File | Route | Status |
|----------------|-------|--------|
| `EnhancedAuthorizationCodeFlowV2.tsx` | `/flows/enhanced-authorization-code-v2` | ❌ BACKUP - Routed but not in menu |

### Legacy/Old Flows (No Version Number)
| Component File | Route | Status |
|----------------|-------|--------|
| `AuthorizationCodeFlow.tsx` | `/flows/authorization-code` | ❌ BACKUP - Multiple routes, not in menu |
| `EnhancedAuthorizationCodeFlow.tsx` | `/flows/enhanced-authorization-code` | ❌ BACKUP - Routed but not in menu |
| `ImplicitGrantFlow.tsx` | `/flows-old/implicit` | ❌ BACKUP - Old route, not in menu |
| `ClientCredentialsFlow.tsx` | Multiple routes | ❌ BACKUP - Old routes, not in menu |
| `WorkerTokenFlow.tsx` | `/flows-old/worker-token` | ❌ BACKUP - Old route, not in menu |
| `HybridFlow.tsx` | `/oidc/hybrid` | ❌ BACKUP - Old route, not in menu |
| `HybridPostFlow.tsx` | N/A | ❌ BACKUP - Not routed |
| `DeviceCodeFlow.tsx` | `/flows-old/device-code` | ❌ BACKUP - Old route, not in menu |
| `DeviceCodeFlowOIDC.tsx` | `/flows/device-code-oidc` | ❌ BACKUP - Routed but not in menu |
| `ResourceOwnerPasswordFlow.tsx` | `/flows/resource-owner-password` | ❌ BACKUP - Routed but not in menu |
| `PARFlow.tsx` | `/flows/par` | ⚠️ KEEP - In Resources menu |

### Other Pages (Keep - Not Flows)
| Component File | Route | Status |
|----------------|-------|--------|
| `UserInfoFlow.tsx` | `/flows-old/userinfo` | ⚠️ KEEP - Utility page |
| `IDTokensFlow.tsx` | `/flows-old/id-tokens` | ⚠️ KEEP - Utility page |
| `Flows.tsx` | `/flows-old` | ⚠️ KEEP - Legacy container |
| `OAuthFlowsNew.tsx` | `/flows` | ⚠️ KEEP - Main flows page |

---

## Summary

### ✅ Keep (V5 Flows in Menu): 17 files
- All OAuth 2.0 V5 flows (5 files)
- All OIDC V5 flows (4 files)
- Unsupported flows in menu (3 files)
- PingOne Token flows (4 files)
- PAR Flow (1 file)

### ❌ Backup (V2/V3/V4 Not in Menu): ~20 files
- V4 flows (2 files)
- V3 flows (6 files)
- V2 flows (1 file)
- Legacy flows without version (11+ files)

### ⚠️ Review (Utility/Container Pages): 4 files
- Flow container pages
- Utility pages (UserInfo, IDTokens)
