# OAuth Authz V2 Pattern Conversion Checklist

Convert all OAuth/OIDC flows from flows2 to use the new 4-panel OAuth Authz V2 pattern (Config | Protocol | Inspector).

Reference: `src/v8u/components/OAuthAuthzV2/` and `~/.claude/skills/oauth-authz-v2-redesign/SKILL.md`

## Priority 1 — Core OAuth Flows

- [x] **Authorization Code** (`authorizationCode.flow.tsx`)
  - Route: `/v2/flows/authorization-code`
  - Component: `src/v8u/components/AuthCodeFlowV2/`
  - Status: ✅ Complete
  - 6-step flow: Configure → PKCE → AuthRequest → Code → Exchange → Tokens

- [ ] **Implicit & Hybrid** (`implicitHybrid.flow.tsx`)
  - Route: `/v2/flows/implicit-hybrid`
  - Component: `src/v8u/components/ImplicitHybridFlowV2/`
  - 4-step flow: Configure → Authorization → Token → Use Tokens
  - Note: Implicit is legacy but still used in some SPAs

- [ ] **Client Credentials** (`clientCredentials.flow.tsx`)
  - Route: `/v2/flows/client-credentials`
  - Component: `src/v8u/components/ClientCredentialsFlowV2/`
  - 3-step flow: Configure → Exchange → Tokens
  - Note: Simplest flow, no user interaction

- [ ] **Device Authorization** (`deviceAuthorization.flow.tsx`)
  - Route: `/v2/flows/device-authorization`
  - Component: `src/v8u/components/DeviceFlowV2/`
  - 5-step flow: Configure → Request Code → Poll → Exchange → Tokens

- [ ] **ROPC** (`ropc.flow.tsx`) — Resource Owner Password Credentials
  - Route: `/v2/flows/ropc`
  - Component: `src/v8u/components/RopcFlowV2/`
  - 3-step flow: Configure → Submit Credentials → Tokens
  - Note: Legacy/deprecated, low priority

## Priority 2 — Token Management

- [ ] **Refresh Token** (`refreshToken.flow.tsx`)
  - Route: `/v2/flows/refresh-token`
  - Component: `src/v8u/components/RefreshTokenFlowV2/`
  - 3-step flow: Configure → Exchange Refresh → New Tokens

- [ ] **Token Exchange** (`tokenExchange.flow.tsx`)
  - Route: `/v2/flows/token-exchange`
  - Component: `src/v8u/components/TokenExchangeFlowV2/`
  - 3-step flow: Configure → Exchange → New Token
  - Note: RFC 8693 (SAML, JWT, etc. conversion)

- [ ] **Token Introspection** (`tokenIntrospection.flow.tsx`)
  - Route: `/v2/flows/token-introspection`
  - Component: `src/v8u/components/TokenIntrospectionFlowV2/`
  - 3-step flow: Configure → Submit Token → Introspection Result

- [ ] **Token Revocation** (`tokenRevocation.flow.tsx`)
  - Route: `/v2/flows/token-revocation`
  - Component: `src/v8u/components/TokenRevocationFlowV2/`
  - 2-step flow: Configure → Revoke → Result

## Priority 3 — Advanced OAuth Flows

- [ ] **PAR** (`par.flow.tsx`) — Pushed Authorization Requests
  - Route: `/v2/flows/par`
  - Component: `src/v8u/components/PARFlowV2/`
  - 5-step flow: Configure → Push AuthRequest → Poll → Auth → Exchange
  - Note: Modern OIDC Best Practice

- [ ] **DPoP** (`dpop.flow.tsx`) — Demonstration of Proof-of-Possession
  - Route: `/v2/flows/dpop`
  - Component: `src/v8u/components/DPoPFlowV2/`
  - 5-step flow: Configure → Generate Proof → AuthRequest → Exchange → Use DPoP
  - Note: Bearer token protection mechanism

- [ ] **Redirectless** (`redirectless.flow.tsx`)
  - Route: `/v2/flows/redirectless`
  - Component: `src/v8u/components/RedirectlessFlowV2/`
  - 4-step flow: Configure → Request → Poll → Tokens
  - Note: Direct token delivery without redirect

## Priority 4 — Info Endpoints

- [ ] **UserInfo** (`userInfo.flow.tsx`)
  - Route: `/v2/flows/user-info`
  - Component: `src/v8u/components/UserInfoFlowV2/`
  - 3-step flow: Configure → Submit AccessToken → User Claims

- [ ] **OIDC Discovery** (`oidcDiscovery.flow.tsx`)
  - Route: `/v2/flows/oidc-discovery`
  - Component: `src/v8u/components/OIDCDiscoveryFlowV2/`
  - 2-step flow: Configure → Fetch Metadata
  - Note: Read-only, informational

## Implementation Notes

### Template Structure
Each new component should follow this structure:
```
src/v8u/components/{FlowName}V2/
├── {FlowName}V2.tsx           (wrapper + ThemeProvider)
├── {FlowName}Layout.tsx       (state + handlers)
├── types.ts                    (FlowConfig interface)
├── components/
│   ├── ConfigPanel.tsx        (form with flow-specific fields)
│   ├── ProtocolPanel.tsx      (N-step flow visualization)
│   └── flowStepsData.ts       (step definitions)
├── services/
│   └── flowExecutionService.ts (flow simulation)
├── utils/
│   └── validation.ts          (config validation)
└── styles/
    └── (inherited from OAuthAuthzV2)
```

### Reusable Components
- `ThemeContext` (shared from OAuthAuthzV2)
- `Header` (theme toggle, title)
- `Sidebar` (flow selector stub)
- `InspectorPanel` (request/response tracking)
- CSS layout and variables (same grid, colors, fonts)

### Key Decisions Per Flow
1. **Step count**: Simplify to essential steps only
2. **Config fields**: Mode (Real/Mock), Spec (2.0/2.1), OIDC toggle where applicable
3. **Service timing**: 1-7 second simulated flow (visual feedback)
4. **Inspector content**: Show relevant requests/responses for each step

## Progress Summary

- [ ] 0/4 — Priority 1 Core Flows (excluding Authorization Code ✅)
  - [ ] Implicit & Hybrid
  - [ ] Client Credentials
  - [ ] Device Authorization
  - [ ] ROPC

- [ ] 0/4 — Priority 2 Token Management
  - [ ] Refresh Token
  - [ ] Token Exchange
  - [ ] Token Introspection
  - [ ] Token Revocation

- [ ] 0/3 — Priority 3 Advanced Flows
  - [ ] PAR
  - [ ] DPoP
  - [ ] Redirectless

- [ ] 0/2 — Priority 4 Info Endpoints
  - [ ] UserInfo
  - [ ] OIDC Discovery

**Total:** ✅ 1/14 Complete

## Related Files to Update

- `src/App.tsx` — Route imports and mappings
- `src/config/sidebarMenuConfig.ts` — Navigation entries (optional, routes already accessible)
- `~/.claude/skills/oauth-authz-v2-redesign/SKILL.md` — Add examples as flows are converted
