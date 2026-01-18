# V8 Services Documentation

**Last Updated:** 2025-01-27  
**Purpose:** Complete documentation for all V8 services

---

## Documentation Structure

Each service has two types of documentation:

1. **UI Contract** (`{service-name}-ui-contract.md`) - Technical specification for developers
2. **Restore Documentation** (`{service-name}-restore.md`) - Implementation details for restoration

---

## Service Categories

### Core OAuth/OIDC Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `oauthIntegrationServiceV8` | ✅ | ✅ | OAuth authorization code flow integration |
| `implicitFlowIntegrationServiceV8` | ✅ | ✅ | Implicit flow integration |
| `hybridFlowIntegrationServiceV8` | ✅ | ✅ | Hybrid flow integration |
| `clientCredentialsIntegrationServiceV8` | ✅ | ✅ | Client credentials flow integration |
| `deviceCodeIntegrationServiceV8` | ✅ | ✅ | Device code flow integration |
| `ropcIntegrationServiceV8` | ✅ | ✅ | Resource owner password credentials (mock) |

### Configuration & Validation Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `specVersionServiceV8` | ✅ | ✅ | Specification version management |
| `preFlightValidationServiceV8` | ✅ | ✅ | Pre-flight validation checks |
| `configCheckerServiceV8` | ✅ | ✅ | Configuration validation |
| `credentialsServiceV8` | ✅ | ✅ | Credential storage and management |
| `unifiedFlowOptionsServiceV8` | ✅ | ✅ | Unified flow options management |
| `flowOptionsServiceV8` | ✅ | ✅ | Flow options management |

### Token & Authentication Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `tokenOperationsServiceV8` | ✅ | ✅ | Token operations (refresh, introspect) |
| `tokenDisplayServiceV8` | ✅ | ✅ | Token display and formatting |
| `workerTokenServiceV8` | ✅ | ✅ | Worker token management |
| `workerTokenStatusServiceV8` | ✅ | ✅ | Worker token status checking |
| `oidcDiscoveryServiceV8` | ✅ | ✅ | OIDC discovery document fetching |

### MFA Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `mfaServiceV8` | ✅ | ✅ | Core MFA operations |
| `mfaAuthenticationServiceV8` | ✅ | ✅ | MFA authentication flows |
| `mfaConfigurationServiceV8` | ✅ | ✅ | MFA configuration management |
| `mfaEducationServiceV8` | ✅ | ✅ | MFA educational content |
| `mfaReportingServiceV8` | ✅ | ✅ | MFA reporting APIs |
| `passkeyServiceV8` | ✅ | ✅ | Passkey/FIDO2 operations |
| `webAuthnAuthenticationServiceV8` | ✅ | ✅ | WebAuthn authentication |
| `fido2SessionCookieServiceV8` | ✅ | ✅ | FIDO2 session cookie management |
| `emailMfaSignOnFlowServiceV8` | ✅ | ✅ | Email MFA sign-on flow |

### Utility Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `appDiscoveryServiceV8` | ✅ | ✅ | Application discovery from PingOne |
| `authMethodServiceV8` | ✅ | ✅ | Authentication method management |
| `tokenEndpointAuthMethodServiceV8` | ✅ | ✅ | Token endpoint auth method |
| `redirectUriServiceV8` | ✅ | ✅ | Redirect URI management |
| `responseTypeServiceV8` | ✅ | ✅ | Response type management |
| `redirectlessServiceV8` | ✅ | ✅ | Redirectless flow support |
| `flowResetServiceV8` | ✅ | ✅ | Flow reset functionality |
| `storageServiceV8` | ✅ | ✅ | Storage abstraction |
| `dualStorageServiceV8` | ✅ | ✅ | Dual storage (localStorage + IndexedDB) |
| `validationServiceV8` | ✅ | ✅ | General validation utilities |
| `errorHandlerV8` | ✅ | ✅ | Error handling utilities |
| `oauthErrorCodesServiceV8` | ✅ | ✅ | OAuth error code definitions |
| `uiNotificationServiceV8` | ✅ | ✅ | UI notification service |
| `tooltipContentServiceV8` | ✅ | ✅ | Tooltip content management |
| `apiDisplayServiceV8` | ✅ | ✅ | API call display formatting |
| `specUrlServiceV8` | ✅ | ✅ | Specification URL management |
| `environmentIdServiceV8` | ✅ | ✅ | Environment ID management |
| `phoneAutoPopulationServiceV8` | ✅ | ✅ | Phone number auto-population |
| `protectServiceV8` | ✅ | ✅ | Feature protection/lockdown |
| `sharedCredentialsServiceV8` | ✅ | ✅ | Shared credentials management |
| `deviceCreateDemoServiceV8` | ✅ | ✅ | Device creation demo |
| `unifiedMFASuccessPageServiceV8` | ✅ | ✅ | Unified MFA success page |

---

## Documentation Standards

### UI Contract Format

Each service UI contract should include:

1. **Overview** - Service purpose and responsibilities
2. **API Interface** - Method signatures and parameters
3. **Return Types** - Response structures
4. **Error Handling** - Error types and handling
5. **State Management** - State persistence and lifecycle
6. **Dependencies** - Required services and modules
7. **Usage Examples** - Code examples
8. **Testing Checklist** - Testing requirements

### Restore Document Format

Each service restore document should include:

1. **File Location** - Exact file path
2. **Critical Implementation Details** - Key code patterns
3. **Dependencies** - Required imports and services
4. **Storage Strategy** - Data persistence approach
5. **Common Issues** - Known problems and fixes
6. **Code Snippets** - Restoration code examples

---

## Quick Reference

### Finding Service Documentation

**By Service Name:**
- Look for `{service-name}-ui-contract.md` for technical specs
- Look for `{service-name}-restore.md` for implementation details

**By Category:**
- Core OAuth/OIDC: `docs/services/core/`
- Configuration: `docs/services/config/`
- Token & Auth: `docs/services/token/`
- MFA: `docs/services/mfa/`
- Utilities: `docs/services/utils/`

---

## Related Documentation

- [Unified Flow Documentation](../flows/UNIFIED_FLOW_DOCUMENTATION_INDEX.md)
- [MFA Documentation](../mfa-ui-documentation/README.md)
- [Documentation Guide](../DOCUMENTATION_GUIDE.md)
