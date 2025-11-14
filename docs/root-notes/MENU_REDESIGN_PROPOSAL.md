# Sidebar Menu Redesign Proposal

## Current Issues
1. **PingOne group is too large** - Mixes flows with utilities/admin tools
2. **Tools & Utilities is mixed** - Contains actual tools AND educational guides
3. **PingOne utilities are scattered** - Metrics, Audit, Webhooks, Licensing need grouping
4. **Educational vs Real features** - Mock features mixed with production features

---

## Proposed New Menu Structure

```
┌─────────────────────────────────────────────────────────┐
│ 📋 MAIN (4 items)                                        │
│   ├─ 🏠 Dashboard                                       │
│   ├─ ⚙️  Setup & Configuration                         │
│   ├─ 🤖 Ping AI Resources                              │
│   └─ 📊 Flow Overview (if exists)                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔐 OAUTH 2.0 FLOWS (5 items)                            │
│   ├─ 🔑 Authorization Code (V7.2)                      │
│   ├─ ⚡ Implicit Flow (V7)                             │
│   ├─ 📱 Device Authorization (V7)                      │
│   ├─ 🔑 Client Credentials (V7)                        │
│   └─ 🔄 Token Exchange (V7)                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 👤 OPENID CONNECT (4 items)                             │
│   ├─ 🔑 Authorization Code (V7.2)                      │
│   ├─ ⚡ Implicit Flow (V7)                             │
│   ├─ 📱 Device Authorization (V7)                      │
│   └─ 🔀 Hybrid Flow (V7)                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟠 PINGONE FLOWS (4 items)                              │
│   ├─ 🔑 Worker Token (V7)                              │
│   ├─ 🔒 Pushed Authorization Request (V7)              │
│   ├─ 🛡️  PingOne MFA (V7)                              │
│   └─ 🛡️  PingOne Authentication                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📊 PINGONE ADMIN & MONITORING (NEW GROUP) (5 items)     │
│   ├─ 👤 User Profile                                   │
│   ├─ 📈 Identity Metrics                               │
│   ├─ 📋 Audit Activities                               │
│   ├─ 🔔 Webhook Viewer                                 │
│   └─ 📄 Organization Licensing                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🛠️  DEVELOPER TOOLS (6 items)                           │
│   ├─ 🔍 OIDC Discovery                                 │
│   ├─ 🔑 Token Management                               │
│   ├─ ⚙️  Advanced Configuration                        │
│   ├─ 🔗 URL Decoder                                    │
│   ├─ 🔍 JWKS Troubleshooting                           │
│   └─ 📦 SDK Sample App                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📚 GUIDES & REFERENCE (5 items)                         │
│   ├─ 📖 OAuth 2.1                                      │
│   ├─ 👥 OIDC Session Management                        │
│   ├─ 📘 RAR vs PAR and DPoP Guide                      │
│   ├─ 🧪 Mock & Educational Features                    │
│   └─ 📋 OAuth Scopes Reference                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🎭 MOCK & EDUCATIONAL FLOWS (NEW GROUP) (7 items)      │
│   ├─ 🟢 DPoP (Educational/Mock) ⚠️                     │
│   ├─ 🔑 JWT Bearer Token (V7) ⚠️                      │
│   ├─ 🛡️  SAML Bearer Assertion (V7) ⚠️                │
│   ├─ 🔒 Resource Owner Password (V7) ⚠️                │
│   ├─ 📋 RAR Flow (V7) ⚠️                               │
│   ├─ 🔐 CIBA Flow (V7) ⚠️                              │
│   └─ ⚙️  Advanced OAuth Parameters Demo ⚠️             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📖 DOCUMENTATION (6 items)                              │
│   ├─ 📘 OIDC Overview                                  │
│   ├─ 📕 OIDC Specifications                            │
│   ├─ 🛡️  OAuth 2.0 Security Best Practices            │
│   ├─ 🤖 AI Identity Architectures                      │
│   ├─ 🤖 OIDC for AI                                    │
│   └─ 🛡️  PingOne AI Perspective                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🎓 LEARNING & COMPARISON (NEW - Optional) (2 items)     │
│   ├─ 📊 Flow Comparison                                │
│   └─ 📈 Interactive Diagrams                           │
└─────────────────────────────────────────────────────────┘
```

---

## Key Changes

### 1. NEW GROUP: "PingOne Admin & Monitoring"
**Purpose:** Group all PingOne administrative and monitoring utilities
- User Profile
- Identity Metrics
- Audit Activities
- Webhook Viewer
- Organization Licensing

**Icon:** 📊 (Bar Chart) or 🔍 (Activity Monitor)
**Color:** Blue or Purple

### 2. RENAMED: "Tools & Utilities" → "Developer Tools"
**Purpose:** Focus on actual developer utilities, not guides
- Removed: OAuth 2.1, OIDC Session Management, RAR vs PAR Guide (moved to Guides)
- Kept: OIDC Discovery, Token Management, Advanced Config, URL Decoder, JWKS, SDK Sample

### 3. NEW GROUP: "Guides & Reference"
**Purpose:** Educational content and reference materials
- OAuth 2.1
- OIDC Session Management
- RAR vs PAR and DPoP Guide
- Mock & Educational Features
- OAuth Scopes Reference

**Icon:** 📚 (Book)
**Color:** Green

### 4. CLEANED: "PingOne Flows"
**Removed:** Utilities moved to Admin & Monitoring, DPoP moved to Mock Flows
- Keep only actual PingOne-supported authentication flows

### 5. CLEANED: "OAuth 2.0 Flows" & "OpenID Connect"
**Removed:** Mock/Educational flows moved to new Mock & Educational Flows group
- OAuth: Removed JWT Bearer Token, SAML Bearer Token, Resource Owner Password (all mock)
- OIDC: Removed CIBA Flow (educational/mock)

### 6. NEW GROUP: "Mock & Educational Flows"
**Purpose:** Group all flows that are not fully supported by PingOne
- DPoP (Educational/Mock)
- JWT Bearer Token (V7) - PingOne doesn't support
- SAML Bearer Assertion (V7) - PingOne doesn't support
- Resource Owner Password (V7) - PingOne doesn't support (deprecated)
- RAR Flow (V7) - Educational/mock implementation
- CIBA Flow (V7) - Educational/mock implementation
- Advanced OAuth Parameters Demo - Educational demonstration

**Icon:** 🎭 (Theater Masks) or ⚠️ (Warning)
**Color:** Orange or Yellow (Warning color)

### 7. OPTIONAL: "Learning & Comparison"
**Purpose:** Flow comparison and visual learning tools
- Flow Comparison
- Interactive Diagrams

**Note:** Could also be merged into "Guides & Reference" if preferred

---

## Group Order (Top to Bottom)

1. **Main** - Core app features (always visible)
2. **OAuth 2.0 Flows** - Standard OAuth flows (PingOne-supported)
3. **OpenID Connect** - OIDC-specific flows (PingOne-supported)
4. **PingOne Flows** - PingOne-specific authentication flows
5. **Mock & Educational Flows** - Flows not supported by PingOne ⭐ NEW
6. **PingOne Admin & Monitoring** - PingOne utilities and monitoring ⭐ NEW
7. **Developer Tools** - Developer utilities
8. **Guides & Reference** - Educational content ⭐ NEW
9. **Documentation** - Technical documentation
10. **Learning & Comparison** (Optional) - Flow comparison tools

---

## Benefits

✅ **Better Organization:** Clear separation of flows, tools, and guides
✅ **Logical Grouping:** Related items grouped together
✅ **Easier Discovery:** Users know where to find admin tools vs flows
✅ **Scalable:** Easy to add new items to appropriate groups
✅ **Cleaner PingOne Group:** Only flows, not utilities

---

## Visual Summary

```
MAIN (4) → Quick access to core features
↓
OAUTH FLOWS (5) → Standard OAuth (PingOne-supported only)
↓
OIDC FLOWS (4) → OpenID Connect (PingOne-supported only)
↓
PINGONE FLOWS (4) → PingOne-specific flows
↓
MOCK FLOWS (7) → Educational/mock flows ⭐ NEW
↓
PINGONE ADMIN (5) → Monitoring & management ⭐ NEW
↓
DEVELOPER TOOLS (6) → Practical utilities
↓
GUIDES & REFERENCE (5) → Educational content ⭐ NEW
↓
DOCUMENTATION (6) → Technical docs
↓
LEARNING (2) → Comparison tools (Optional)
```

---

## Mock/Educational Flows Identified

Based on PingOneMockFeatures page and code analysis:

### Fully Mock (Not Supported by PingOne):
1. **DPoP** - RFC 9449 (Demonstration of Proof-of-Possession)
2. **JWT Bearer Token Flow** - RFC 7523
3. **SAML Bearer Assertion Flow** - RFC 7522
4. **Resource Owner Password Credentials (ROPC)** - RFC 6749 (deprecated)
5. **Advanced OAuth Parameters Demo** - Educational demonstration

### Educational/Mock Implementations:
6. **RAR Flow (V7)** - RFC 9396 (Rich Authorization Requests) - Mock implementation
7. **CIBA Flow (V7)** - RFC 9436 (Client Initiated Backchannel Authentication) - Educational

### Currently in Sidebar:
- ✅ DPoP - In PingOne Flows (should move to Mock Flows)
- ✅ JWT Bearer Token (V7) - In OAuth 2.0 Flows (should move to Mock Flows)
- ✅ SAML Bearer Assertion (V7) - In OAuth 2.0 Flows (should move to Mock Flows)
- ✅ ROPC (V7) - In OAuth 2.0 Flows (should move to Mock Flows)
- ✅ CIBA (V7) - In OpenID Connect (should move to Mock Flows)

### Missing from Sidebar (but routes exist):
- ❌ RAR Flow (V7) - Route `/flows/rar-v7` exists but not in sidebar ⚠️ **NEEDS TO BE ADDED**
- ❌ Advanced OAuth Parameters Demo - Route `/flows/advanced-oauth-params-demo` exists but not in sidebar ⚠️ **NEEDS TO BE ADDED**

---

## Questions for Review

1. Should "Learning & Comparison" be a separate group or merged into "Guides & Reference"?
2. Should "OIDC Overview" stay in Documentation or move to Guides?
3. Should "Flow Comparison" and "Interactive Diagrams" be in a separate group or Guides?
4. Should "Mock & Educational Flows" be a separate group or merged into "Guides & Reference"?
5. Are RAR and CIBA flows actually supported by PingOne, or are they fully mock?
6. Any other items that should be moved/reorganized?

