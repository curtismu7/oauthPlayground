# Sidebar Menu Audit

**Analysis of flows missing from sidebar menu and mock vs real flow classification**

---

## Summary

Several flows exist in the codebase but are **not listed in the sidebar menu**. Additionally, some flows that were thought to be "mock" actually make real PingOne API calls.

---

## ✅ Confirmed Mock Flows (No Real API Calls)

These flows are truly mock - they simulate behavior without making real PingOne API calls:

### 1. MockOIDCResourceOwnerPasswordFlow.tsx
- **Path**: `/flows/mock-oidc-resource-owner-password` (needs route)
- **Status**: ✅ True mock - no API calls
- **In Menu**: ❌ NO
- **Has Default Credentials**: ✅ YES (updated)
- **Action**: Add to sidebar menu under "Mock Flows" section

### 2. SAMLBearerAssertionFlowV7.tsx
- **Path**: `/flows/saml-bearer-assertion-v7`
- **Status**: ✅ True mock - simulates token generation
- **In Menu**: ❌ NO
- **Has Default Credentials**: ✅ YES (updated)
- **Action**: Add to sidebar menu

### 3. OAuthAuthorizationCodeFlowV7_Condensed_Mock.tsx
- **Path**: `/flows/oauth-authorization-code-v7-condensed-mock`
- **Status**: ✅ True mock - condensed UI prototype
- **In Menu**: ❌ NO
- **Has Default Credentials**: ❓ Needs verification
- **Action**: Add to sidebar menu under "Mock Flows"

### 4. V7CondensedMock.tsx
- **Path**: `/flows/v7-condensed-mock`
- **Status**: ✅ True mock - UI prototype
- **In Menu**: ❌ NO
- **Has Default Credentials**: N/A (just UI demo)
- **Action**: Add to sidebar menu under "Mock Flows"

### 5. TestMock.tsx
- **Path**: `/flows/test-mock`
- **Status**: ✅ True mock - simple test page
- **In Menu**: ❌ NO
- **Has Default Credentials**: N/A
- **Action**: Probably don't add (just for testing)

---

## ❌ Real Flows (Make Actual API Calls)

These flows make real PingOne API calls and should NOT have default credentials:

### 1. TokenRevocationFlow.tsx
- **Path**: `/flows/token-revocation` (needs route)
- **Status**: ❌ Real flow - makes API calls to revoke tokens
- **In Menu**: ❌ NO
- **Has Default Credentials**: ❌ NO (correctly reverted)
- **Action**: Add to sidebar menu under "OAuth 2.0 Flows" or "Token Management"

### 2. UserInfoPostFlow.tsx
- **Path**: `/flows/userinfo-post` (needs route)
- **Status**: ❌ Real flow - calls UserInfo endpoint
- **In Menu**: ❌ NO
- **Has Default Credentials**: ❌ NO (correctly reverted)
- **Action**: Add to sidebar menu under "OIDC" or "Token Management"

### 3. TokenIntrospectionFlow.tsx
- **Path**: `/flows/token-introspection` (needs route)
- **Status**: ❌ Real flow - calls introspection endpoint
- **In Menu**: ❌ NO
- **Has Default Credentials**: ❌ NO (correctly reverted)
- **Action**: Add to sidebar menu under "Token Management"

### 4. MFAFlow.tsx
- **Path**: `/flows/mfa`
- **Status**: ❌ Real flow - real MFA authentication
- **In Menu**: ✅ YES (under /flows submenu)
- **Has Default Credentials**: ❌ NO (correctly reverted)
- **Action**: Already accessible but not in main sidebar

### 5. DeviceFlow.tsx
- **Path**: Not routed (old version?)
- **Status**: ❌ Real flow - makes device authorization API calls
- **In Menu**: ❌ NO
- **Has Default Credentials**: ❌ NO (correctly reverted)
- **Note**: This appears to be an older version. DeviceAuthorizationFlowV7 is the current V7 version
- **Action**: Verify if this should be deprecated

---

## 📋 Missing Routes

These flows exist but don't have routes in App.tsx:

1. **MockOIDCResourceOwnerPasswordFlow.tsx** - needs route
2. **TokenRevocationFlow.tsx** - needs route
3. **UserInfoPostFlow.tsx** - needs route
4. **TokenIntrospectionFlow.tsx** - needs route

---

## 🎯 Recommended Sidebar Menu Structure

### Current Structure
```
OAuth 2.0 Flows
├── Authorization Code (V7)
├── Implicit Flow (V7)
├── Device Authorization (V7)
├── OAuth Client Credentials (V7)
├── OAuth Resource Owner Password (V7)
└── Token Exchange (V7)

PingOne
├── PingOne Authentication
├── PingOne Identity Metrics
└── PingOne Mock Features
```

### Recommended Structure
```
OAuth 2.0 Flows
├── Authorization Code (V7)
├── Implicit Flow (V7)
├── Device Authorization (V7)
├── OAuth Client Credentials (V7)
├── OAuth Resource Owner Password (V7)
└── Token Exchange (V7)

OIDC Flows
├── OIDC Hybrid (V7)
├── CIBA (V7)
└── UserInfo Flow                    ← ADD

Token Management
├── Token Introspection              ← ADD
├── Token Revocation                 ← ADD
└── Token Inspector

PingOne Flows
├── PingOne PAR (V7)
├── PingOne MFA (V7)
├── PingOne Authentication
├── PingOne Identity Metrics
└── Redirectless Flow (V7)

Mock Flows (Educational)             ← ADD NEW SECTION
├── Mock OIDC ROPC Flow              ← ADD
├── SAML Bearer Assertion (Mock)     ← ADD
├── OAuth Auth Code Condensed Mock   ← ADD
└── V7 Condensed Mock (Prototype)    ← ADD

Advanced Flows
├── JWT Bearer Token (V7)
├── SAML Bearer Assertion (V7)       ← MOVE HERE (or keep in Mock)
├── Worker Token (V7)
└── RAR (V7)
```

---

## 🔧 Action Items

### High Priority

1. **Add Missing Routes** in App.tsx:
   ```typescript
   <Route path="/flows/mock-oidc-ropc" element={<MockOIDCResourceOwnerPasswordFlow />} />
   <Route path="/flows/token-revocation" element={<TokenRevocationFlow />} />
   <Route path="/flows/userinfo" element={<UserInfoPostFlow />} />
   <Route path="/flows/token-introspection" element={<TokenIntrospectionFlow />} />
   ```

2. **Add to Sidebar Menu** in Sidebar.tsx:
   - Create "Mock Flows" section
   - Add Token Management section
   - Add missing flows to appropriate sections

3. **Verify Default Credentials**:
   - Check OAuthAuthorizationCodeFlowV7_Condensed_Mock.tsx
   - Ensure all mock flows have pre-filled credentials
   - Ensure all real flows do NOT have pre-filled credentials

### Medium Priority

4. **Deprecate or Update**:
   - DeviceFlow.tsx (if superseded by DeviceAuthorizationFlowV7)
   - TestMock.tsx (if just for testing)

5. **Documentation**:
   - Update flow documentation to clearly mark mock vs real
   - Add "Mock" badge to mock flows in sidebar
   - Add tooltips explaining the difference

### Low Priority

6. **Organize Menu**:
   - Group related flows together
   - Add visual separators
   - Consider collapsible sections for better organization

---

## 🎨 Proposed Menu Icons

### Mock Flows Section
- **Icon**: `FiCpu` (processor/simulation icon)
- **Color**: `#f59e0b` (amber - indicates caution/educational)

### Token Management Section
- **Icon**: `FiKey` or `FiDatabase`
- **Color**: `#8b5cf6` (purple)

### Individual Flow Icons
- **Token Revocation**: `FiX` or `FiTrash2` (red)
- **Token Introspection**: `FiEye` or `FiSearch` (blue)
- **UserInfo**: `FiUser` (green)
- **Mock OIDC ROPC**: `FiLock` with mock badge (amber)
- **SAML Bearer Mock**: `FiShield` with mock badge (amber)

---

## 📊 Flow Classification Summary

| Flow | Type | API Calls | In Menu | Has Route | Default Creds |
|------|------|-----------|---------|-----------|---------------|
| MockOIDCResourceOwnerPasswordFlow | Mock | ❌ No | ❌ No | ❌ No | ✅ Yes |
| SAMLBearerAssertionFlowV7 | Mock | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| OAuthAuthCodeV7CondensedMock | Mock | ❌ No | ❌ No | ✅ Yes | ❓ Check |
| V7CondensedMock | Mock | ❌ No | ❌ No | ✅ Yes | N/A |
| TestMock | Mock | ❌ No | ❌ No | ✅ Yes | N/A |
| TokenRevocationFlow | Real | ✅ Yes | ❌ No | ❌ No | ❌ No |
| UserInfoPostFlow | Real | ✅ Yes | ❌ No | ❌ No | ❌ No |
| TokenIntrospectionFlow | Real | ✅ Yes | ❌ No | ❌ No | ❌ No |
| MFAFlow | Real | ✅ Yes | ⚠️ Partial | ✅ Yes | ❌ No |
| DeviceFlow | Real | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

## 🚀 Next Steps

1. Review and approve recommended menu structure
2. Add missing routes to App.tsx
3. Update Sidebar.tsx with new menu items
4. Verify default credentials in mock flows
5. Test all flows are accessible
6. Update documentation

---

*Sidebar Menu Audit - November 2025*
