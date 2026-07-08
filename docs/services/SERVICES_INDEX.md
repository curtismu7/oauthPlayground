# V8 Services Documentation Index

**Last Updated:** 2025-01-27  
**Purpose:** Complete index of all V8 services and their documentation status

---

## Documentation Status

| Service | UI Contract | Restore | Priority | Category |
|---------|-------------|---------|----------|----------|
| `specVersionService` | ✅ | ✅ | High | Config |
| `preFlightValidationService` | ✅ | ✅ | High | Config |
| `credentialsService` | ✅ | ✅ | High | Config |
| `oauthIntegrationService` | ✅ | ✅ | High | Core |
| `workerTokenService` | ✅ | ✅ | High | Token |
| `mfaService` | ✅ | ✅ | High | MFA |
| `mfaAuthenticationService` | ✅ | ✅ | High | MFA |
| `implicitFlowIntegrationService` | ⏳ | ⏳ | Medium | Core |
| `hybridFlowIntegrationService` | ⏳ | ⏳ | Medium | Core |
| `clientCredentialsIntegrationService` | ⏳ | ⏳ | Medium | Core |
| `deviceCodeIntegrationService` | ⏳ | ⏳ | Medium | Core |
| `tokenOperationsService` | ⏳ | ⏳ | Medium | Token |
| `oidcDiscoveryService` | ⏳ | ⏳ | Medium | Token |
| `appDiscoveryService` | ⏳ | ⏳ | Medium | Utils |
| `configCheckerService` | ⏳ | ⏳ | Low | Config |
| `unifiedFlowOptionsService` | ⏳ | ⏳ | Low | Config |
| `flowOptionsService` | ⏳ | ⏳ | Low | Config |
| `tokenDisplayService` | ⏳ | ⏳ | Low | Token |
| `workerTokenStatusService` | ⏳ | ⏳ | Low | Token |
| `mfaConfigurationService` | ⏳ | ⏳ | Low | MFA |
| `mfaEducationService` | ⏳ | ⏳ | Low | MFA |
| `mfaReportingService` | ⏳ | ⏳ | Low | MFA |
| `passkeyService` | ⏳ | ⏳ | Low | MFA |
| `webAuthnAuthenticationService` | ⏳ | ⏳ | Low | MFA |
| `fido2SessionCookieService` | ⏳ | ⏳ | Low | MFA |
| `emailMfaSignOnFlowService` | ⏳ | ⏳ | Low | MFA |
| `authMethodService` | ⏳ | ⏳ | Low | Utils |
| `tokenEndpointAuthMethodService` | ⏳ | ⏳ | Low | Utils |
| `redirectUriService` | ⏳ | ⏳ | Low | Utils |
| `responseTypeService` | ⏳ | ⏳ | Low | Utils |
| `redirectlessService` | ⏳ | ⏳ | Low | Utils |
| `flowResetService` | ⏳ | ⏳ | Low | Utils |
| `storageService` | ⏳ | ⏳ | Low | Utils |
| `dualStorageService` | ⏳ | ⏳ | Low | Utils |
| `validationService` | ⏳ | ⏳ | Low | Utils |
| `errorHandler` | ⏳ | ⏳ | Low | Utils |
| `oauthErrorCodesService` | ⏳ | ⏳ | Low | Utils |
| `uiNotificationService` | ⏳ | ⏳ | Low | Utils |
| `tooltipContentService` | ⏳ | ⏳ | Low | Utils |
| `apiDisplayService` | ⏳ | ⏳ | Low | Utils |
| `specUrlService` | ⏳ | ⏳ | Low | Utils |
| `environmentIdService` | ⏳ | ⏳ | Low | Utils |
| `phoneAutoPopulationService` | ⏳ | ⏳ | Low | Utils |
| `protectService` | ⏳ | ⏳ | Low | Utils |
| `sharedCredentialsService` | ⏳ | ⏳ | Low | Utils |
| `deviceCreateDemoService` | ⏳ | ⏳ | Low | Utils |
| `unifiedMFASuccessPageService` | ⏳ | ⏳ | Low | Utils |
| `ropcIntegrationService` | ⏳ | ⏳ | Low | Core |

**Legend:**
- ✅ = Documented
- ⏳ = Pending documentation
- High = Critical services (documented first)
- Medium = Important services
- Low = Utility services

---

## Service Categories

### Core OAuth/OIDC Services (6 services)
- Authorization code, implicit, hybrid, client credentials, device code, ROPC flows

### Configuration & Validation Services (6 services)
- Spec version, pre-flight validation, config checking, credentials, flow options

### Token & Authentication Services (5 services)
- Token operations, display, worker token, OIDC discovery

### MFA Services (8 services)
- Core MFA, authentication, configuration, education, reporting, passkeys, WebAuthn, email

### Utility Services (20+ services)
- App discovery, auth methods, redirect URIs, storage, validation, error handling, UI notifications, etc.

---

## Documentation Priority

### Phase 1: High Priority (Complete)
- ✅ `specVersionService`
- ✅ `preFlightValidationService`
- ✅ `credentialsService`
- ✅ `oauthIntegrationService`
- ✅ `workerTokenService`
- ✅ `mfaService`
- ✅ `mfaAuthenticationService`

### Phase 2: Medium Priority (In Progress)
- ⏳ Core OAuth flow integrations
- ⏳ Token services
- ⏳ App discovery

### Phase 3: Low Priority (Future)
- ⏳ Utility services
- ⏳ Supporting services

---

## Creating New Service Documentation

Use the template: [`SERVICE_DOCUMENTATION_TEMPLATE.md`](./SERVICE_DOCUMENTATION_TEMPLATE.md)

1. Copy the template
2. Fill in service-specific details
3. Add to appropriate category folder
4. Update this index

---

## Related Documentation

- [Service Documentation README](./README.md)
- [Service Documentation Template](./SERVICE_DOCUMENTATION_TEMPLATE.md)
- [Unified Flow Documentation](../flows/UNIFIED_FLOW_DOCUMENTATION_INDEX.md)
- [Documentation Guide](../DOCUMENTATION_GUIDE.md)
