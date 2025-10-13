# CollapsibleHeader Audit - All V6 Flows

This document lists every CollapsibleHeader instance across all V6 flows with their proposed theme and icon assignments.

## 🎨 Color/Icon Legend

- 🟠 **Orange** + ⚙️ `FiSettings` = Configuration
- 🔵 **Blue** + 🚀 `FiSend` = Flow Execution
- 🟣 **Purple** + 📚 `FiBook` = Educational (Odd)
- 🟢 **Green** + ✅ `FiCheckCircle` = Educational (Even) / Success
- 💙 **Default** + 📦 `FiPackage` = Results/Received

---

## 📋 Flow-by-Flow Breakdown

### 1. **OAuthAuthorizationCodeFlowV6.tsx** (8 sections)

#### Step 0 - Configuration
```typescript
// Line ~1324 - Educational (1st)
<CollapsibleHeader
  title="OAuth 2.0 Authorization Code Overview"
  icon={<FiBook />}           // 📚 Change from FiInfo
  theme="purple"              // 🟣 ADD
  defaultCollapsed={false}
>

// Line ~1390 - Configuration
<CollapsibleHeader
  title="Application Configuration & Credentials"
  icon={<FiSettings />}       // ⚙️ Keep
  theme="orange"              // 🟠 ADD
  defaultCollapsed={false}
>

// Line ~1485 - Configuration
<CollapsibleHeader
  title="Advanced OAuth Parameters (Optional)"
  icon={<FiSettings />}       // ⚙️ Keep
  theme="orange"              // 🟠 ADD
  defaultCollapsed={true}
>
```

#### Step 1 - PKCE
```typescript
// Line ~1548 - Educational (1st in step)
<CollapsibleHeader
  title="What is PKCE?"
  icon={<FiBook />}           // 📚 Change from FiShield
  theme="purple"              // 🟣 ADD
  defaultCollapsed={false}
>

// Line ~1579 - Educational (2nd in step)
<CollapsibleHeader
  title="Understanding Code Verifier & Code Challenge"
  icon={<FiCheckCircle />}    // ✅ Change from FiKey
  theme="green"               // 🟢 ADD
  defaultCollapsed={true}
>
```

#### Step 2 - Authorization URL
```typescript
// Line ~1674 - Educational (1st in step)
<CollapsibleHeader
  title="Understanding Authorization Requests"
  icon={<FiBook />}           // 📚 Change from FiGlobe
  theme="purple"              // 🟣 ADD
  defaultCollapsed={false}
>

// Line ~1717 - Educational (2nd in step)
<CollapsibleHeader
  title="Authorization URL Parameters Deep Dive"
  icon={<FiCheckCircle />}    // ✅ Change from FiKey
  theme="green"               // 🟢 ADD
  defaultCollapsed={true}
>
```

#### Step 3 - Authorization Response
```typescript
// Line ~1929 - Educational (1st in step)
<CollapsibleHeader
  title="Authorization Response Overview"
  icon={<FiBook />}           // 📚 Change from FiCheckCircle
  theme="purple"              // 🟣 ADD
  defaultCollapsed={false}
>

// Line ~1946 - Results/Received
<CollapsibleHeader
  title="Authorization Code Details"
  icon={<FiPackage />}        // 📦 Change from FiKey
  // NO theme (default blue)
  defaultCollapsed={true}
>
```

#### Step 4 - Token Exchange
```typescript
// Line ~2037 - Educational (1st in step)
<CollapsibleHeader
  title="Token Exchange Overview"
  icon={<FiBook />}           // 📚 Change from FiKey
  theme="purple"              // 🟣 ADD
  defaultCollapsed={false}
>

// Line ~2101 - Flow Execution
<CollapsibleHeader
  title="Token Exchange Details"
  icon={<FiSend />}           // 🚀 Change from FiRefreshCw
  theme="blue"                // 🔵 ADD
  defaultCollapsed={true}
>
```

**Total Changes: 12 sections**
- Add imports: `FiBook`, `FiPackage`, `FiSend`
- Icon changes: 10
- Theme additions: 11

---

### 2. **OIDCAuthorizationCodeFlowV6.tsx** (Similar to OAuth, ~10 sections)

#### Step 0
```typescript
// Educational (1st)
<CollapsibleHeader
  title="OIDC Authorization Code Overview"
  icon={<FiBook />}
  theme="purple"
>

// Configuration
<CollapsibleHeader
  title="OIDC Authorization Code Configuration"
  icon={<FiSettings />}
  theme="orange"
>

// Configuration
<CollapsibleHeader
  title="Advanced OIDC Parameters (Optional)"
  icon={<FiSettings />}
  theme="orange"
>
```

#### Step 1-4 (Same pattern as OAuth)
- PKCE sections: Purple → Green
- Authorization sections: Purple → Green
- Token Exchange: Purple → Blue

**Total Changes: ~12 sections**

---

### 3. **DeviceAuthorizationFlowV6.tsx** (~10 sections)

```typescript
// Step 0 - Configuration
<CollapsibleHeader
  title="Select Device Type (Visual Example)"
  icon={<FiSettings />}       // ⚙️ Change from FiMonitor
  theme="orange"              // 🟠 ADD
>

// Step 0 - Educational (1st)
<CollapsibleHeader
  title="Device Authorization Flow Overview"
  icon={<FiBook />}
  theme="purple"
>

// Step 0 - Educational (2nd) - BUT user wants yellow/purple for "How It Works"
<CollapsibleHeader
  title="How It Works"
  icon={<FiBook />}           // 📚 Keep as educational
  theme="purple"              // 🟣 User wants this yellow/purple
>

// Step 0 - Configuration
<CollapsibleHeader
  title="Advanced OAuth Parameters (Optional)"
  icon={<FiSettings />}
  theme="orange"
>

// Step 1 - Flow Execution
<CollapsibleHeader
  title="Request Device Code"
  icon={<FiSend />}           // 🚀 Change from FiKey
  theme="blue"
>

// Step 1 - Results/Received
<CollapsibleHeader
  title="Device Code Received"
  icon={<FiPackage />}        // 📦 Change from FiCheckCircle
  // NO theme (default)
>

// Step 2 - Flow Execution
<CollapsibleHeader
  title="User Authorization Required"
  icon={<FiSend />}           // 🚀 Change from FiSmartphone
  theme="blue"
>

// Step 3 - Results/Received
<CollapsibleHeader
  title="Tokens Received"
  icon={<FiPackage />}
  // NO theme
>

// Step 4 - Completion/Success
<CollapsibleHeader
  title="Flow Complete"
  icon={<FiCheckCircle />}
  theme="green"
>
```

**Total Changes: ~10 sections**

---

### 4. **OIDCHybridFlowV6.tsx** (2 sections)

```typescript
// Configuration
<CollapsibleHeader
  title="Application Configuration & Credentials"
  icon={<FiSettings />}
  theme="orange"
>

// Flow Execution
<CollapsibleHeader
  title="Authorization URL Generation"
  icon={<FiSend />}           // 🚀 Change from FiKey
  theme="blue"
>
```

**Total Changes: 2 sections**

---

### 5. **ClientCredentialsFlowV6.tsx** (~3 sections)

```typescript
// Educational (1st)
<CollapsibleHeader
  title="Client Credentials Flow Overview"
  icon={<FiBook />}
  theme="purple"
>

// Configuration
<CollapsibleHeader
  title="Application Configuration & Credentials"
  icon={<FiSettings />}
  theme="orange"
>

// Flow Execution
<CollapsibleHeader
  title="Token Request"
  icon={<FiSend />}
  theme="blue"
>

// Results/Received
<CollapsibleHeader
  title="Token Response"
  icon={<FiPackage />}
  // NO theme
>
```

**Total Changes: 4 sections**

---

### 6. **JWTBearerTokenFlowV6.tsx** (~6 sections)

```typescript
// Educational (1st)
<CollapsibleHeader
  title="JWT Bearer Token Flow Overview"
  icon={<FiBook />}
  theme="purple"
>

// Configuration
<CollapsibleHeader
  title="Application Configuration & Credentials"
  icon={<FiSettings />}
  theme="orange"
>

// Configuration
<CollapsibleHeader
  title="JWT Signature Configuration"
  icon={<FiSettings />}
  theme="orange"
>

// Flow Execution
<CollapsibleHeader
  title="JWT Assertion Generation"
  icon={<FiSend />}
  theme="blue"
>

// Results/Received
<CollapsibleHeader
  title="Generated JWT Assertion"
  icon={<FiPackage />}
  // NO theme
>

// Flow Execution
<CollapsibleHeader
  title="Token Exchange"
  icon={<FiSend />}
  theme="blue"
>

// Results/Received
<CollapsibleHeader
  title="Token Response"
  icon={<FiPackage />}
  // NO theme
>
```

**Total Changes: 7 sections**

---

### 7. **SAMLBearerAssertionFlowV6.tsx** (4 sections)

```typescript
// Configuration/Builder
<CollapsibleHeader
  title="SAML Assertion Builder"
  icon={<FiSettings />}       // ⚙️ Change from FiUsers
  theme="orange"
>

// Results/Received
<CollapsibleHeader
  title="Generated SAML Assertion"
  icon={<FiPackage />}        // 📦 Change from FiCheckCircle
  // NO theme
>

// Flow Execution
<CollapsibleHeader
  title="Token Request"
  icon={<FiSend />}           // 🚀 Change from FiGlobe
  theme="blue"
>

// Results/Received
<CollapsibleHeader
  title="Token Response"
  icon={<FiPackage />}        // 📦 Change from FiCheckCircle
  // NO theme
>
```

**Total Changes: 4 sections**

---

### 8. **PingOnePARFlowV6.tsx** (5 sections)

```typescript
// Educational (1st)
<CollapsibleHeader
  title="PAR Flow Detailed Overview"
  icon={<FiBook />}           // 📚 Change from FiInfo
  theme="purple"
>

// Educational (2nd)
<CollapsibleHeader
  title="PKCE Parameters Overview"
  icon={<FiCheckCircle />}    // ✅ Change from FiKey
  theme="green"
>

// Educational (3rd)
<CollapsibleHeader
  title="PAR Request Overview"
  icon={<FiBook />}           // 📚 Change from FiShield
  theme="purple"
>

// Educational (4th)
<CollapsibleHeader
  title="Authorization URL Overview"
  icon={<FiCheckCircle />}    // ✅ Change from FiExternalLink
  theme="green"
>

// Completion/Success
<CollapsibleHeader
  title="PAR Flow Complete"
  icon={<FiCheckCircle />}    // ✅ Keep
  theme="green"
>
```

**Total Changes: 5 sections**

---

### 9. **OIDCDeviceAuthorizationFlowV6.tsx** (~8 sections)

Similar to DeviceAuthorizationFlowV6 with OIDC-specific sections.

**Total Changes: ~10 sections**

---

## 📊 Summary Statistics

| Flow | Sections | Icon Changes | Theme Additions | Imports Needed |
|------|----------|--------------|-----------------|----------------|
| OAuthAuthorizationCodeFlowV6 | 12 | 10 | 11 | FiBook, FiPackage, FiSend |
| OIDCAuthorizationCodeFlowV6 | 12 | 10 | 11 | FiBook, FiPackage, FiSend |
| DeviceAuthorizationFlowV6 | 10 | 8 | 9 | FiBook, FiPackage, FiSend |
| OIDCHybridFlowV6 | 2 | 1 | 2 | FiBook, FiSend |
| ClientCredentialsFlowV6 | 4 | 3 | 3 | FiBook, FiPackage, FiSend |
| JWTBearerTokenFlowV6 | 7 | 5 | 5 | FiBook, FiPackage, FiSend |
| SAMLBearerAssertionFlowV6 | 4 | 4 | 2 | FiPackage, FiSend |
| PingOnePARFlowV6 | 5 | 4 | 5 | FiBook |
| OIDCDeviceAuthorizationFlowV6 | 10 | 8 | 9 | FiBook, FiPackage, FiSend |

**TOTAL: ~66 sections across 9 flows**

---

## 🚀 Implementation Order (Recommended)

1. ✅ **OIDCHybridFlowV6** (2 sections) - COMPLETE ✨
2. **ClientCredentialsFlowV6** (4 sections) - Small, straightforward
3. **SAMLBearerAssertionFlowV6** (4 sections) - Small
4. **PingOnePARFlowV6** (5 sections) - Medium
5. **JWTBearerTokenFlowV6** (7 sections) - Medium
6. **DeviceAuthorizationFlowV6** (10 sections) - Larger
7. **OIDCDeviceAuthorizationFlowV6** (10 sections) - Larger
8. **OAuthAuthorizationCodeFlowV6** (12 sections) - Complex
9. **OIDCAuthorizationCodeFlowV6** (12 sections) - Complex

---

## ✅ Next Steps

1. **Review this audit** - Confirm color/icon assignments
2. **Start with OIDCHybridFlowV6** - Smallest flow for testing
3. **Test build after each flow** - Ensure no breakage
4. **Commit after each successful flow** - Safe incremental progress
5. **Update this document** - Mark completed flows

---

## 📝 Notes

- All flows need `FiBook`, `FiPackage`, `FiSend` imports added
- "How It Works" sections should use Purple (educational) per user preference
- Results/Received sections should NOT have a theme prop (defaults to blue)
- Completion sections should use Green theme
- Config sections should use Orange theme (will add dynamic orange→green later)
