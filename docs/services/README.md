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
| `oauthIntegrationService` | ✅ | ✅ | OAuth authorization code flow integration |
| `implicitFlowIntegrationService` | ✅ | ✅ | Implicit flow integration |
| `hybridFlowIntegrationService` | ✅ | ✅ | Hybrid flow integration |
| `clientCredentialsIntegrationService` | ✅ | ✅ | Client credentials flow integration |
| `deviceCodeIntegrationService` | ✅ | ✅ | Device code flow integration |
| `ropcIntegrationService` | ✅ | ✅ | Resource owner password credentials (mock) |

### Configuration & Validation Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `specVersionService` | ✅ | ✅ | Specification version management |
| `preFlightValidationService` | ✅ | ✅ | Pre-flight validation checks |
| `configCheckerService` | ✅ | ✅ | Configuration validation |
| `credentialsService` | ✅ | ✅ | Credential storage and management |
| `unifiedFlowOptionsService` | ✅ | ✅ | Unified flow options management |
| `flowOptionsService` | ✅ | ✅ | Flow options management |

### Token & Authentication Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `tokenOperationsService` | ✅ | ✅ | Token operations (refresh, introspect) |
| `tokenDisplayService` | ✅ | ✅ | Token display and formatting |
| `workerTokenService` | ✅ | ✅ | Worker token management |
| `workerTokenStatusService` | ✅ | ✅ | Worker token status checking |
| `oidcDiscoveryService` | ✅ | ✅ | OIDC discovery document fetching |

### MFA Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `mfaService` | ✅ | ✅ | Core MFA operations |
| `mfaAuthenticationService` | ✅ | ✅ | MFA authentication flows |
| `mfaConfigurationService` | ✅ | ✅ | MFA configuration management |
| `mfaEducationService` | ✅ | ✅ | MFA educational content |
| `mfaReportingService` | ✅ | ✅ | MFA reporting APIs |
| `passkeyService` | ✅ | ✅ | Passkey/FIDO2 operations |
| `webAuthnAuthenticationService` | ✅ | ✅ | WebAuthn authentication |
| `fido2SessionCookieService` | ✅ | ✅ | FIDO2 session cookie management |
| `emailMfaSignOnFlowService` | ✅ | ✅ | Email MFA sign-on flow |

### Utility Services

| Service | UI Contract | Restore | Description |
|---------|-------------|---------|-------------|
| `appDiscoveryService` | ✅ | ✅ | Application discovery from PingOne |
| `authMethodService` | ✅ | ✅ | Authentication method management |
| `tokenEndpointAuthMethodService` | ✅ | ✅ | Token endpoint auth method |
| `redirectUriService` | ✅ | ✅ | Redirect URI management |
| `responseTypeService` | ✅ | ✅ | Response type management |
| `redirectlessService` | ✅ | ✅ | Redirectless flow support |
| `flowResetService` | ✅ | ✅ | Flow reset functionality |
| `storageService` | ✅ | ✅ | Storage abstraction |
| `dualStorageService` | ✅ | ✅ | Dual storage (localStorage + IndexedDB) |
| `validationService` | ✅ | ✅ | General validation utilities |
| `errorHandler` | ✅ | ✅ | Error handling utilities |
| `oauthErrorCodesService` | ✅ | ✅ | OAuth error code definitions |
| `uiNotificationService` | ✅ | ✅ | UI notification service |
| `tooltipContentService` | ✅ | ✅ | Tooltip content management |
| `apiDisplayService` | ✅ | ✅ | API call display formatting |
| `specUrlService` | ✅ | ✅ | Specification URL management |
| `environmentIdService` | ✅ | ✅ | Environment ID management |
| `phoneAutoPopulationService` | ✅ | ✅ | Phone number auto-population |
| `protectService` | ✅ | ✅ | Feature protection/lockdown |
| `sharedCredentialsService` | ✅ | ✅ | Shared credentials management |
| `deviceCreateDemoService` | ✅ | ✅ | Device creation demo |
| `unifiedMFASuccessPageService` | ✅ | ✅ | Unified MFA success page |

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
