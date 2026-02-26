# Menu Grouping Analysis & Proposal

This document captures the **current** sidebar menu structure (from `DragDropSidebar.tsx`) and a **proposed** grouping so items sit under logical categories. Use it to review and adjust before implementing (e.g. in SidebarMenuPing or a shared menu config).

---

## Current structure (as in DragDropSidebar)

Top-level groups and their items. Subgroups are indented.

| # | Group | Items / Subgroups |
|---|--------|-------------------|
| 1 | **Production** | MFA Feature Flags, API Status, Flow Comparison Tool, Resources API Tutorial, SPIFFE/SPIRE Mock, Postman Collection Generator, New Unified MFA, Unified OAuth & OIDC, Delete All Devices, Enhanced State Management (V2), Token Monitoring Dashboard, Protect Portal App, Environment Management, SDK Examples, Debug Log Viewer, Token Exchange (V8M) |
| 2 | **Production (Legacy)** | DPoP Authorization Code (V8), Authorization Code (V8), Implicit Flow (V8), PAR Flow Test, CIBA Flow (V9) |
| 3 | **Reference Materials** | Ping AI Resources |
| 4 | **OAuth 2.0 Flows** | Authorization Code (V7.2), Implicit Flow (V7), Device Authorization (V7), Client Credentials (V7) |
| 5 | **OpenID Connect** | Authorization Code (V7.2), Implicit Flow (V7), Device Authorization (V7 – OIDC), Hybrid Flow (V7) |
| 6 | **PingOne Flows** | Pushed Authorization Request (V7), PingOne MFA (V7), PingOne MFA Workflow Library (V7), Kroger Grocery Store MFA, PingOne Authentication, Redirectless Flow (V7), PAR Flow |
| 7 | **Token Apps** | Worker Token (V7), Worker Token Check, Token Management, Token Introspection, Token Revocation, UserInfo Flow, PingOne Logout |
| 8 | **Mock & Educational Flows** | → **OAuth Mock Flows**: JWT Bearer (V7), SAML Bearer (V7), ROPC (V7), OAuth2 ROPC (Legacy), Advanced OAuth Parameters Demo, Mock OIDC ROPC, Auth Code Condensed (Mock), V7 Condensed (Prototype) • → **Advanced Mock Flows**: DPoP (Educational), RAR Flow (V7), SAML Service Provider (V1) |
| 9 | **PingOne Tools** | → **PingOne User & Identity**: User Profile, Identity Metrics, Password Reset • → **PingOne Monitoring**: Audit Activities, Webhook Viewer, Organization Licensing |
| 10 | **Developer Tools** | → **Core Developer Tools**: OIDC Discovery, Advanced Configuration • → **Developer Utilities**: JWKS Troubleshooting, URL Decoder, OAuth Code Generator Hub, Application Generator, Client Generator, Service Test Runner, Postman Collection Generator |
| 11 | **Security Guides** | OAuth 2.1, OIDC Session Management, PingOne Sessions API |
| 12 | **Reference Materials** (2nd) | RAR vs PAR and DPoP Guide, CIBA vs Device Authorization Guide, Mock & Educational Features, OAuth Scopes Reference, Ping AI Resources |
| 13 | **OAuth/OIDC Documentation** | OIDC Overview, OIDC Specifications, OAuth 2.0 Security Best Practices, SPIFFE/SPIRE with PingOne |
| 14 | **AI Documentation** | AI Identity Architectures, OIDC for AI, OAuth for AI, PingOne AI Perspective |
| 15 | **Tools & Utilities** | DaVinci Todo App, SDK Sample App, Ultimate Token Display |

**Observations:**

- **Production** is a large catch-all (17 items) mixing admin, status, education, unified flows, utilities, and portals.
- **Reference Materials** appears twice (different group ids: `reference-materials` and `reference-materials-docs`).
- **Postman Collection Generator** appears in both Production and Developer Utilities (different paths: `/postman-collection-generator` vs `/tools/postman-generator`).
- **New Unified MFA** appears in both Production and Production (Legacy).
- **Dashboard** (home) is not in the menu; the app redirects `/` → `/dashboard` but there is no explicit “Dashboard” link.
- No single “Home” or “Dashboard” entry at the top.

---

## Proposed grouping (for review)

Goal: fewer top-level groups, clear categories, no duplicate labels for different groups, and a single place for Dashboard/Home.

### 1. **Dashboard** (new top-level)

| Path | Label |
|------|--------|
| `/dashboard` | Dashboard |

Single entry so the default route is visible in the menu.

---

### 2. **Admin & Configuration**

Admin, config, and environment.

| Path | Label |
|------|--------|
| `/api-status` | API Status |
| `/v8/mfa-feature-flags` | MFA Feature Flags |
| `/environments` | Environment Management |
| `/advanced-configuration` | Advanced Configuration |
| `/auto-discover` | OIDC Discovery |

*Rationale:* Operators have one place for admin and config.

---

### 3. **PingOne Platform**

User, identity, and platform monitoring (current “PingOne Tools”).

| Path | Label |
|------|--------|
| `/pingone-user-profile` | User Profile |
| `/pingone-identity-metrics` | Identity Metrics |
| `/security/password-reset` | Password Reset |
| `/pingone-audit-activities` | Audit Activities |
| `/pingone-webhook-viewer` | Webhook Viewer |
| `/organization-licensing` | Organization Licensing |

---

### 4. **Unified & Production Flows**

Primary entry points for “real” flows and unified UIs.

| Path | Label |
|------|--------|
| `/v8u/unified` | Unified OAuth & OIDC |
| `/v8/unified-mfa` | Unified MFA |
| `/v8/delete-all-devices` | Delete All Devices |
| `/v8u/flow-comparison` | Flow Comparison Tool |
| `/v8u/token-monitoring` | Token Monitoring Dashboard |
| `/v8u/enhanced-state-management` | Enhanced State Management (V2) |
| `/protect-portal` | Protect Portal App |
| `/flows/token-exchange-v7` | Token Exchange (V8M) |

*Rationale:* One group for the main unified flows and key production tools. Delete All Devices is included here as an MFA device utility.

---

### 5. **OAuth 2.0 Flows**

Standard OAuth 2.0 flows (V7/V8).

| Path | Label |
|------|--------|
| `/flows/oauth-authorization-code-v7-2` | Authorization Code (V7.2) |
| `/flows/implicit-v7` | Implicit Flow (V7) |
| `/flows/device-authorization-v7` | Device Authorization (V7) |
| `/flows/client-credentials-v7` | Client Credentials (V7) |
| `/flows/oauth-authorization-code-v8` | Authorization Code (V8) |
| `/flows/implicit-v8` | Implicit Flow (V8) |
| `/flows/dpop-authorization-code-v8` | DPoP Authorization Code (V8) |

---

### 6. **OpenID Connect**

OIDC flows (V7/V9).

| Path | Label |
|------|--------|
| `/flows/oauth-authorization-code-v7-2` | Authorization Code (V7.2) |
| `/flows/implicit-v7?variant=oidc` | Implicit Flow (V7) |
| `/flows/device-authorization-v7?variant=oidc` | Device Authorization (V7 – OIDC) |
| `/flows/oidc-hybrid-v7` | Hybrid Flow (V7) |
| `/flows/ciba-v9` | CIBA Flow (V9) |

---

### 7. **PingOne Flows**

PingOne-specific auth and MFA flows.

| Path | Label |
|------|--------|
| `/flows/pingone-par-v7` | Pushed Authorization Request (V7) |
| `/flows/redirectless-v7-real` | Redirectless Flow (V7) |
| `/flows/pingone-complete-mfa-v7` | PingOne MFA (V7) |
| `/flows/pingone-mfa-workflow-library-v7` | PingOne MFA Workflow Library (V7) |
| `/flows/kroger-grocery-store-mfa` | Kroger Grocery Store MFA |
| `/pingone-authentication` | PingOne Authentication |

---

### 8. **Tokens & Session**

Token and session management in one place.

| Path | Label |
|------|--------|
| `/flows/worker-token-v7` | Worker Token (V7) |
| `/worker-token-tester` | Worker Token Check |
| `/token-management` | Token Management |
| `/flows/token-introspection` | Token Introspection |
| `/flows/token-revocation` | Token Revocation |
| `/flows/userinfo` | UserInfo Flow |
| `/flows/pingone-logout` | PingOne Logout |

*Rationale:* Merge “Token Apps” into a single group. Name can be “Token Apps” if you prefer.

---

### 9. **Developer & Tools**

Code generation, utilities, Postman (single entry), SDK samples. No testing pages.

| Path | Label |
|------|--------|
| `/postman-collection-generator` | Postman Collection Generator |
| `/oauth-code-generator-hub` | OAuth Code Generator Hub |
| `/application-generator` | Application Generator |
| `/client-generator` | Client Generator |
| `/jwks-troubleshooting` | JWKS Troubleshooting |
| `/url-decoder` | URL Decoder |
| `/sdk-examples` | SDK Examples |
| `/ultimate-token-display-demo` | Ultimate Token Display |
| `/davinci-todo` | DaVinci Todo App |

*Rationale:* One Postman entry only (`/postman-collection-generator`). Testing/validation pages (PAR Test, Debug Log Viewer, Service Test Runner) are not in the menu.

---

### 10. **Education & Tutorials**

Learning and reference flows (non-mock).

| Path | Label |
|------|--------|
| `/v8/resources-api` | Resources API Tutorial |
| `/v8u/spiffe-spire` | SPIFFE/SPIRE Mock |
| `/flows/advanced-oauth-params-demo` | Advanced OAuth Parameters Demo |

*Rationale:* “Education” items that are not mock-only; can be extended with more tutorials.

---

### 11. **Mock & Educational Flows**

Keep as one collapsible section; optional sub-groups.

- **OAuth Mock:** JWT Bearer (V7), SAML Bearer (V7), ROPC (V7), OAuth2 ROPC (Legacy), Mock OIDC ROPC, Auth Code Condensed (Mock), V7 Condensed (Prototype)
- **Advanced Mock:** DPoP (Educational), RAR Flow (V7), SAML Service Provider (V1)

Paths unchanged from current structure.

---

### 12. **AI - Ping**

Ping Identity AI resources and documentation.

| Path | Label |
|------|--------|
| `/ping-ai-resources` | Ping AI Resources |
| `/ai-identity-architectures` | AI Identity Architectures |
| `/docs/oidc-for-ai` | OIDC for AI |
| `/docs/oauth-for-ai` | OAuth for AI |
| `/docs/ping-view-on-ai` | PingOne AI Perspective |

---

### 13. **Documentation & Reference**

Single “Documentation & Reference” group for non-AI docs and guides. AI content is in **AI - Ping**.

- **Guides:** RAR vs PAR and DPoP, CIBA vs Device Authorization, Mock & Educational Features, OAuth Scopes Reference  
- **OAuth/OIDC:** OIDC Overview, OIDC Specifications, OAuth 2.0 Security Best Practices, SPIFFE/SPIRE with PingOne  
- **Security:** OAuth 2.1, OIDC Session Management, PingOne Sessions API  

*Rationale:* One place for all non-AI docs; AI is in its own group.

---

## Summary table (proposed)

| # | Proposed group | Purpose |
|---|----------------|--------|
| 1 | Dashboard | Home / default route |
| 2 | Admin & Configuration | Admin, config, environment |
| 3 | PingOne Platform | User, identity, monitoring |
| 4 | Unified & Production Flows | Main unified UIs, production flows, Delete All Devices |
| 5 | OAuth 2.0 Flows | Standard OAuth 2.0 flows (V7/V8) |
| 6 | OpenID Connect | OIDC flows (V7/V9) |
| 7 | PingOne Flows | PingOne-specific auth and MFA |
| 8 | Tokens & Session | Token and session management |
| 9 | Developer & Tools | Code gen, Postman (single), SDK, utilities — no testing |
| 10 | Education & Tutorials | Tutorials and non-mock education |
| 11 | Mock & Educational Flows | Mock/deprecated flows (collapsible) |
| 12 | AI - Ping | Ping AI resources, AI Identity Architectures, OIDC/OAuth for AI, PingOne AI Perspective |
| 13 | Documentation & Reference | All non-AI docs and guides |

**Decisions confirmed:**

- **Dashboard** — Yes: top-level “Dashboard” item at `/dashboard`.
- **Testing** — Removed: no testing/validation items in the menu (PAR Test, Debug Log Viewer, Service Test Runner are omitted).
- **Postman** — One entry only: “Postman Collection Generator” at `/postman-collection-generator`.
- **OAuth vs OIDC** — Separate groups: “OAuth 2.0 Flows” and “OpenID Connect”.
- **Order** — Admin & Configuration 2nd; PingOne Platform 3rd.

---

## Next step

- **Shared config added:** `src/config/sidebarMenuConfig.ts` exports `SIDEBAR_MENU_GROUPS`, `SidebarMenuGroup`, `SidebarMenuItem`, and `itemIdFromPath()`. This structure matches the proposal above and can be imported by:
  - The new **SidebarMenuPing** (or Ping UI menu) component when implemented.
  - The current **Sidebar** / **DragDropSidebar** if you later choose to read from config (e.g. map config groups to the locked component’s format or replace the menu with a config-driven render).
- To use the config in a component: `import { SIDEBAR_MENU_GROUPS } from '../config/sidebarMenuConfig';` then iterate over groups and items to render links. Icons and styling remain in the consuming component.

No changes to the locked `DragDropSidebar.tsx` are required unless you later decide to point it at this config.
