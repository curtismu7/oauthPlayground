# Credentials Import/Export Service - Implementation Inventory

## Overview
This document inventories all flows and applications that require credentials import/export functionality and tracks their implementation status.

## Standardized Service
- **Service**: `src/services/credentialsImportExportService.ts`
- **Component**: `src/components/CredentialsImportExport.tsx`
- **Version**: 9.0.0
- **Standard**: All credential flows should use this standardized service

## Scope Rule

> **Only active side-menu items and the services they use are in scope.**  
> Archived flows (routes that redirect to V9), off-menu pages, and `locked/` snapshots are **out of scope** and must not be modified.

The authoritative list of active menu paths is `src/config/sidebarMenuConfig.ts`.

---

## Implementation Status

### ✅ V9 Flows — All Complete
All V9 flows on the menu have credentials management via `ComprehensiveCredentialsService` (built into the V9 standard). No further action needed here.

| Menu Path | Flow Component | Status |
|-----------|---------------|--------|
| `/flows/oauth-authorization-code-v9` | `OAuthAuthorizationCodeFlowV9` | ✅ |
| `/flows/oauth-authorization-code-v9-condensed` | `OAuthAuthorizationCodeFlowV9_Condensed` | ✅ |
| `/flows/implicit-v9` | `ImplicitFlowV9` | ✅ |
| `/flows/device-authorization-v9` | `DeviceAuthorizationFlowV9` | ✅ |
| `/flows/pingone-par-v9` | `PingOnePARFlowV9` | ✅ |
| `/flows/redirectless-v9-real` | `RedirectlessFlowV9_Real` | ✅ |
| `/flows/worker-token-v9` | `WorkerTokenFlowV9` | ✅ |
| `/flows/jwt-bearer-token-v9` | `JWTBearerTokenFlowV9` | ✅ |
| `/flows/dpop-authorization-code-v9` | `DPoPAuthorizationCodeFlowV9` | ✅ |
| `/flows/ciba-v9` | `CIBAFlowV9` | ✅ |
| `/flows/client-credentials-v9` | `ClientCredentialsFlowV9` | ✅ |
| `/flows/oidc-hybrid-v9` | `OIDCHybridFlowV9` | ✅ |
| `/flows/saml-bearer-assertion-v9` | `SAMLBearerAssertionFlowV9` | ✅ |
| `/flows/token-exchange-v9` | `TokenExchangeFlowV9` | ✅ |
| `/flows/rar-v9` | `RARFlowV9` | ✅ |
| `/flows/oauth-ropc-v9` | `OAuthROPCFlowV9` | ✅ |
| `/flows/pingone-mfa-workflow-library-v9` | `MFAWorkflowLibraryFlowV9` | ✅ |

### 🔄 Non-V9 Active Menu Flows

| Menu Path | Flow Component | Status | Notes |
|-----------|---------------|--------|-------|
| `/flows/oauth2-resource-owner-password` | `OAuth2ResourceOwnerPasswordFlow` | ✅ Complete | Pre-existing import/export |
| `/flows/kroger-grocery-store-mfa` | `KrogerGroceryStoreMFA` | ✅ Complete | Pre-existing import/export |
| `/flows/userinfo` | `UserInfoFlow` | ✅ Complete | Pre-existing import/export |
| `/flows/jwt-bearer` | `JWTBearerFlow` | ✅ Complete | Added March 6, 2026 |
| `/flows/par` | `PARFlow` | ✅ Complete | Added March 6, 2026 |
| `/flows/pingone-logout` | `PingOneLogoutFlow` | ✅ Complete | Added March 6, 2026 |
| `/flows/dpop` | `DPoPFlow` | N/A | Pure crypto demo — no credential fields |
| `/flows/token-revocation` | `TokenRevocationFlow` | ✅ Complete | Added March 6, 2026 |
| `/flows/mock-oidc-ropc` | `V7RMOIDCResourceOwnerPasswordFlow` | N/A | Controller-based; uses V9CredentialStorageService directly |
| `/flows/saml-sp-dynamic-acs-v1` | `SAMLServiceProviderFlowV1` | ✅ Complete | Added March 6, 2026 |

### 🔄 V7 Mock Flows (active on menu at `/v7/...`)
These are educational mock simulations using hardcoded `mock-env` / `v7m-mock` environment IDs. They do **not** connect to real PingOne and have no real credentials to import/export.

| Menu Path | Component | Status |
|-----------|-----------|--------|
| `/v7/oidc/authorization-code` | `V7MOAuthAuthCodeV9` | N/A — mock-only, no real creds |
| `/v7/oauth/device-authorization` | `V7MDeviceAuthorizationV9` | N/A — mock-only, no real creds |
| `/v7/oauth/client-credentials` | `V7MClientCredentialsV9` | N/A — mock-only, no real creds |
| `/v7/oauth/implicit` | `V7MImplicitFlowV9` | N/A — mock-only, no real creds |
| `/v7/oauth/ropc` | `V7MROPCV9` | N/A — mock-only, no real creds |

### 📋 Other Applications with Credentials

| Application | Current Status | Implementation Needed | Priority |
|------------|----------------|---------------------|---------|
| `ApplicationGenerator` | ✅ Complete | Has ExportImportPanel | **Low** |
| `HelioMartPasswordReset` | ✅ Complete | Has import/export | **Low** |
| `ConfigurationManager` | ✅ Complete | Has import/export | **Low** |
| `EnhancedConfigurationService` | ✅ Complete | Has CLI import/export | **Low** |

## Implementation Pattern

### Standard Usage
```tsx
import { CredentialsImportExport } from '@/components/CredentialsImportExport';

// In your component
<CredentialsImportExport
  credentials={credentials}
  options={{
    flowType: 'your-flow-type',
    appName: 'Your Flow Name',
    onImportSuccess: (creds) => setCredentials(creds),
    onImportError: (error) => console.error(error),
  }}
/>
```

### Service Usage (Advanced)
```tsx
import { credentialsImportExportService } from '@/services/credentialsImportExportService';

// Custom handlers
const handleExport = credentialsImportExportService.createExportHandler(credentials, options);
const handleImport = credentialsImportExportService.createImportHandler(options);
```

## File Format Standard

### Export Structure
```json
{
  "_meta": {
    "flowType": "oauth-authorization-code",
    "exportedAt": "2026-03-06T12:00:00.000Z",
    "version": "9.0.0",
    "appName": "OAuth Authorization Code Flow",
    "description": "Optional description"
  },
  "credentials": {
    "environmentId": "12345678-1234-1234-1234-123456789abc",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "redirectUri": "https://localhost:3000/callback",
    "scopes": ["openid", "profile", "email"],
    "...": "other flow-specific fields"
  }
}
```

## Migration Priority

### Phase 1: High Priority (Immediate)
- `JWTBearerFlow`
- `DPoPFlow` 
- `PARFlow`
- `TokenExchangeFlow`

### Phase 2: Medium Priority (Next Sprint)
- `PingOneLogoutFlow`
- `OIDCHybridFlowV7`
- `SAMLBearerAssertionFlowV7`
- `DeviceAuthorizationFlowV7`
- `ImplicitFlowV7`
- `OAuthAuthorizationCodeFlowV7`

### Phase 3: Low Priority (Future)
- Document existing implementations
- Standardize any remaining custom implementations

## Benefits of Standardization

1. **Consistent UX**: All flows have the same import/export experience
2. **Reduced Code Duplication**: Single service handles all import/export logic
3. **Validation**: Built-in file validation and error handling
4. **Version Compatibility**: Automatic version checking for imported files
5. **Security**: Sanitization of sensitive fields
6. **User Feedback**: Consistent messaging via modernMessaging

## Testing Requirements

- Import valid credentials file ✅
- Import invalid file format ❌
- Import wrong flow type ❌
- Import incompatible version ❌
- Export with all fields ✅
- Export with minimal fields ✅
- File naming convention ✅
- User feedback messages ✅

## Next Steps

1. **Implement High Priority Flows**: Add CredentialsImportExport to remaining 4 high-priority flows
2. **Update Migration Guides**: Add implementation instructions to all guides
3. **Create Examples**: Provide code examples for different flow types
4. **Testing**: Add automated tests for the service
5. **Documentation**: Update API documentation with service details

---

**Last Updated**: 2026-03-06  
**Version**: 9.0.0  
**Status**: ✅ Complete — all active-menu flows with real credentials have standardized import/export
