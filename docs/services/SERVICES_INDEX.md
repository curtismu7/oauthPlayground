# V8 Services Documentation Index

**Last Updated:** 2025-01-27  
**Purpose:** Complete index of all V8 services and their documentation status

---

## Documentation Status

| Service | UI Contract | Restore | Priority | Category |
|---------|-------------|---------|----------|----------|
| `specVersionServiceV8` | ✅ | ✅ | High | Config |
| `preFlightValidationServiceV8` | ✅ | ✅ | High | Config |
| `credentialsServiceV8` | ✅ | ✅ | High | Config |
| `oauthIntegrationServiceV8` | ✅ | ✅ | High | Core |
| `workerTokenServiceV8` | ✅ | ✅ | High | Token |
| `mfaServiceV8` | ✅ | ✅ | High | MFA |
| `mfaAuthenticationServiceV8` | ✅ | ✅ | High | MFA |
| `implicitFlowIntegrationServiceV8` | ⏳ | ⏳ | Medium | Core |
| `hybridFlowIntegrationServiceV8` | ⏳ | ⏳ | Medium | Core |
| `clientCredentialsIntegrationServiceV8` | ⏳ | ⏳ | Medium | Core |
| `deviceCodeIntegrationServiceV8` | ⏳ | ⏳ | Medium | Core |
| `tokenOperationsServiceV8` | ⏳ | ⏳ | Medium | Token |
| `oidcDiscoveryServiceV8` | ⏳ | ⏳ | Medium | Token |
| `appDiscoveryServiceV8` | ⏳ | ⏳ | Medium | Utils |
| `configCheckerServiceV8` | ⏳ | ⏳ | Low | Config |
| `unifiedFlowOptionsServiceV8` | ⏳ | ⏳ | Low | Config |
| `flowOptionsServiceV8` | ⏳ | ⏳ | Low | Config |
| `tokenDisplayServiceV8` | ⏳ | ⏳ | Low | Token |
| `workerTokenStatusServiceV8` | ⏳ | ⏳ | Low | Token |
| `mfaConfigurationServiceV8` | ⏳ | ⏳ | Low | MFA |
| `mfaEducationServiceV8` | ⏳ | ⏳ | Low | MFA |
| `mfaReportingServiceV8` | ⏳ | ⏳ | Low | MFA |
| `passkeyServiceV8` | ⏳ | ⏳ | Low | MFA |
| `webAuthnAuthenticationServiceV8` | ⏳ | ⏳ | Low | MFA |
| `fido2SessionCookieServiceV8` | ⏳ | ⏳ | Low | MFA |
| `emailMfaSignOnFlowServiceV8` | ⏳ | ⏳ | Low | MFA |
| `authMethodServiceV8` | ⏳ | ⏳ | Low | Utils |
| `tokenEndpointAuthMethodServiceV8` | ⏳ | ⏳ | Low | Utils |
| `redirectUriServiceV8` | ⏳ | ⏳ | Low | Utils |
| `responseTypeServiceV8` | ⏳ | ⏳ | Low | Utils |
| `redirectlessServiceV8` | ⏳ | ⏳ | Low | Utils |
| `flowResetServiceV8` | ⏳ | ⏳ | Low | Utils |
| `storageServiceV8` | ⏳ | ⏳ | Low | Utils |
| `dualStorageServiceV8` | ⏳ | ⏳ | Low | Utils |
| `validationServiceV8` | ⏳ | ⏳ | Low | Utils |
| `errorHandlerV8` | ⏳ | ⏳ | Low | Utils |
| `oauthErrorCodesServiceV8` | ⏳ | ⏳ | Low | Utils |
| `uiNotificationServiceV8` | ⏳ | ⏳ | Low | Utils |
| `tooltipContentServiceV8` | ⏳ | ⏳ | Low | Utils |
| `apiDisplayServiceV8` | ⏳ | ⏳ | Low | Utils |
| `specUrlServiceV8` | ⏳ | ⏳ | Low | Utils |
| `environmentIdServiceV8` | ⏳ | ⏳ | Low | Utils |
| `phoneAutoPopulationServiceV8` | ⏳ | ⏳ | Low | Utils |
| `protectServiceV8` | ⏳ | ⏳ | Low | Utils |
| `sharedCredentialsServiceV8` | ⏳ | ⏳ | Low | Utils |
| `deviceCreateDemoServiceV8` | ⏳ | ⏳ | Low | Utils |
| `unifiedMFASuccessPageServiceV8` | ⏳ | ⏳ | Low | Utils |
| `ropcIntegrationServiceV8` | ⏳ | ⏳ | Low | Core |

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
- ✅ `specVersionServiceV8`
- ✅ `preFlightValidationServiceV8`
- ✅ `credentialsServiceV8`
- ✅ `oauthIntegrationServiceV8`
- ✅ `workerTokenServiceV8`
- ✅ `mfaServiceV8`
- ✅ `mfaAuthenticationServiceV8`

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
