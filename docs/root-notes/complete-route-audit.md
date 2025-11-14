# Complete Route Audit - All Routes vs Sidebar Menu

## 🔍 MISSING ROUTES (Components exist but no routes):
1. **`/flows/authorization-code-v5`** - Component: `AuthorizationCodeFlowV5.tsx` exists but NO ROUTE!

## 📋 ALL ROUTES IN APPLICATION:

### Core Pages:
- `/` → Redirect to `/dashboard`
- `/dashboard` → Dashboard ✅ (in sidebar)
- `/login` → Login (no sidebar needed)
- `/callback` → Callback (no sidebar needed)

### Authentication Flows:
- `/flows` → OAuthFlowsNew ✅ (not in sidebar - this is the flows overview page)
- `/flows/compare` → FlowComparisonTool ✅ (in sidebar as "Flow Comparison")
- `/flows/diagrams` → InteractiveFlowDiagram ✅ (in sidebar as "Interactive Diagrams")
- `/flows/authorization-code` → AuthorizationCodeFlow ✅ (not in sidebar - old flow)
- `/flows/enhanced-authorization-code` → EnhancedAuthorizationCodeFlow ✅ (not in sidebar - old flow)
- `/flows/enhanced-authorization-code-v2` → EnhancedAuthorizationCodeFlowV2 ✅ (not in sidebar - old flow)

### V5 Flows:
- `/flows/oauth-authorization-code-v5` → OAuthAuthorizationCodeFlowV5 ✅ (in sidebar as "OAuth 2.0 Authorization Code V5")
- `/flows/oidc-authorization-code-v5` → OIDCAuthorizationCodeFlowV5 ✅ (in sidebar as "OIDC Authorization Code V5")
- `/flows/worker-token-v5` → WorkerTokenFlowV5 ✅ (in sidebar as "PingOne Worker Token V5")
- **`/flows/authorization-code-v5` → AuthorizationCodeFlowV5** ❌ **MISSING ROUTE!**

### V3 Flows:
- `/flows/oauth2-implicit-v3` → OAuth2ImplicitFlowV3 ✅ (not in sidebar - hidden)
- `/flows/oidc-implicit-v3` → OIDCImplicitFlowV3 ✅ (in sidebar as "OIDC Implicit V3")
- `/flows/oidc-hybrid-v3` → OIDCHybridFlowV3 ✅ (in sidebar as "OIDC Hybrid V3")
- `/flows/oauth2-client-credentials-v3` → OAuth2ClientCredentialsFlowV3 ✅ (not in sidebar - hidden)
- `/flows/oidc-client-credentials-v3` → OIDCClientCredentialsFlowV3 ✅ (in sidebar as "OIDC Client Credentials V3")
- `/flows/device-code-oidc` → DeviceCodeFlowOIDC ✅ (in sidebar as "OIDC Device Code V3")
- `/flows/worker-token-v3` → WorkerTokenFlowV3 ✅ (not in sidebar - hidden)

### Other Flows:
- `/flows/resource-owner-password` → ResourceOwnerPasswordFlow ✅ (not in sidebar - this is OAuth version)
- `/flows/par` → PARFlow ✅ (in sidebar as "Pushed Authorization Request (PAR)")

### OAuth Routes:
- `/oauth/client-credentials` → ClientCredentialsFlow ✅ (not in sidebar - old flow)
- `/oauth/resource-owner-password` → OAuth2ResourceOwnerPasswordFlow ✅ (in sidebar as "OAuth 2.0 Resource Owner Password")

### OIDC Routes:
- `/oidc/userinfo` → UserInfoFlow ✅ (not in sidebar - old route)
- `/oidc/id-tokens` → IDTokensFlow ✅ (not in sidebar - old route)
- `/oidc/authorization-code` → AuthorizationCodeFlow ✅ (not in sidebar - old route)
- `/oidc/hybrid` → HybridFlow ✅ (not in sidebar - old route)
- `/oidc/implicit` → ImplicitGrantFlow ✅ (not in sidebar - old route)
- `/oidc/client-credentials` → ClientCredentialsFlow ✅ (not in sidebar - old route)
- `/oidc/resource-owner-password` → OIDCResourceOwnerPasswordFlow ✅ (in sidebar as "OIDC Resource Owner Password")
- `/oidc/worker-token` → WorkerTokenFlow ✅ (not in sidebar - old route)
- `/oidc/jwt-bearer` → JWTBearerFlow ✅ (not in sidebar - old route)
- `/oidc/device-code` → DeviceCodeFlow ✅ (not in sidebar - old route)

### Configuration & Documentation:
- `/configuration` → Configuration ✅ (not in sidebar - old route)
- `/documentation` → Documentation ✅ (in sidebar as "Local Documentation")
- `/docs/oidc-specs` → OIDCSpecs ✅ (in sidebar as "OIDC Specs")
- `/docs/oidc-for-ai` → OIDCForAI ✅ (in sidebar as "OIDC for AI")
- `/docs/oauth2-security-best-practices` → OAuth2SecurityBestPractices ✅ (in sidebar as "OAuth 2.0 Security Best Practices")

### Tools & Resources:
- `/auto-discover` → AutoDiscover ✅ (in sidebar as "OIDC Discovery")
- `/token-management` → TokenManagement ✅ (in sidebar as "Token Management")
- `/jwks-troubleshooting` → JWKSTroubleshooting ✅ (in sidebar as "JWKS Troubleshooting")
- `/url-decoder` → URLDecoder ✅ (in sidebar as "URL Decoder")

### Special Pages:
- `/ai-overview` → AIOpenIDConnectOverview ✅ (in sidebar as "AI Overview")
- `/advanced-config` → AdvancedConfiguration ✅ (not in sidebar - missing!)
- `/tutorials` → InteractiveTutorials ✅ (not in sidebar - missing!)
- `/oauth-2-1` → OAuth21 ✅ (in sidebar as "OAuth 2.1")
- `/oidc-session-management` → OIDCSessionManagement ✅ (in sidebar as "Session Management")
- `/sdk-sample-app` → SDKSampleApp ✅ (in sidebar as "SDK Sample App")

### Callback Routes (no sidebar needed):
- `/authz-callback`, `/oauth-v3-callback`, `/hybrid-callback`, `/implicit-callback`, `/implicit-callback-v3`, `/worker-token-callback`, `/device-code-status`, `/dashboard-callback`

## 🚨 CRITICAL ISSUES FOUND:

### 1. MISSING ROUTE:
- **`/flows/authorization-code-v5`** - Component exists but no route defined!

### 2. MISSING FROM SIDEBAR:
- **`/advanced-config`** - Route exists but no sidebar link
- **`/tutorials`** - Route exists but no sidebar link

### 3. EXTERNAL LINKS (in sidebar but not routes):
- Test Reusable Step System (`/test-reusable-step-system.html`)
- JWT Decoder (`https://developer.pingidentity.com/en/tools/jwt-decoder.html`)
- Facile Decoder (`https://decoder.pingidentity.cloud/`)
- PingOne API Reference (`https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2`)
- PingOne SDKs (`https://docs.pingidentity.com/sdks/latest/sdks/index.html`)

