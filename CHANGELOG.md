# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2024-12-19

### Added
- **Per-Flow Credentials Configuration**: Each OAuth flow page now has its own credentials configuration block
  - Environment ID, Region, Client ID, Client Secret configuration per flow
  - Token Endpoint Authentication Method selection (none, client_secret_basic, client_secret_post, private_key_jwt)
  - Redirect URI and PKCE settings per flow
  - Additional scopes configuration
  - "Use Global Defaults" toggle for each flow
  - Source indicators showing whether values come from flow override or global default
- **Centralized Configuration Store**: New `configStore` utility with v2 storage format
  - Namespaced storage keys (`p1_import_tool.v2`)
  - Global defaults and per-flow overrides
  - Configuration resolution with fallback logic
  - Automatic migration from v1 to v2 format
  - Comprehensive validation and error handling
- **Enhanced Token Exchange**: Centralized token exchange utility
  - Support for all token endpoint authentication methods
  - Proper handling of client_secret_basic, client_secret_post, and none auth methods
  - Consistent error handling and logging
  - Connectivity testing functionality
- **Flow Credentials Component**: Reusable component for per-flow configuration
  - Secure secret masking with reveal toggle
  - Real-time validation with inline error messages
  - Test Connectivity button for each flow type
  - Consistent UI/UX across all flow pages
- **Comprehensive Test Suite**: Unit tests for configuration management
  - Config store validation and resolution tests
  - Token exchange functionality tests
  - Error handling and edge case coverage
- **Updated Navigation**: Configuration page moved to appear directly below Dashboard in left navbar

### Changed
- **Configuration Management**: Migrated from single global config to per-flow override system
- **Token Exchanges**: Updated to use effective configuration with correct authentication methods
- **Storage Format**: Upgraded to v2 format with proper namespacing and migration support
- **UI Layout**: Flow pages now show Flow Credentials section above existing configuration

### Security
- **Secret Handling**: Client secrets are masked by default with secure reveal toggle
- **No Secrets in Logs**: All logging is redacted to prevent secret exposure
- **Validation**: Comprehensive validation prevents invalid configurations
- **Storage Security**: Proper namespacing and migration handling for configuration data

### Technical Details
- **Flow Types Supported**: auth_code_pkce, hybrid, client_credentials, refresh, introspection, implicit, device_code
- **Authentication Methods**: none, client_secret_basic, client_secret_post, private_key_jwt
- **Storage Keys**: 
  - Global: `p1_import_tool.v2.config.global`
  - Per-flow: `p1_import_tool.v2.config.flow.{flowType}`
- **Migration**: Automatic v1 to v2 migration on first load
- **Logging**: Unified logging with `[⚙️ CONFIG]` and flow-specific tags

### Breaking Changes
- **Storage Format**: Configuration storage format changed from v1 to v2 (automatic migration provided)
- **API Changes**: Token exchange functions now require flow type parameter
- **Component Props**: FlowCredentials component requires flowType prop

### Migration Guide
1. **Automatic Migration**: The system automatically migrates existing v1 configurations to v2 format
2. **Per-Flow Setup**: Configure flow-specific credentials using the new Flow Credentials sections
3. **Global Defaults**: Set up global defaults in the Configuration page (now under Dashboard)
4. **Testing**: Use the Test Connectivity button to verify configuration

### Files Added
- `src/utils/configStore.ts` - Centralized configuration management
- `src/utils/tokenExchange.ts` - Centralized token exchange utilities
- `src/components/FlowCredentials.tsx` - Per-flow credentials component
- `src/tests/configStore.test.ts` - Configuration store tests
- `src/tests/tokenExchange.test.ts` - Token exchange tests

### Files Modified
- `src/components/Sidebar.tsx` - Moved Configuration below Dashboard
- `src/pages/flows/AuthorizationCodeFlow.tsx` - Added Flow Credentials section
- `src/pages/flows/ClientCredentialsFlow.tsx` - Added Flow Credentials section
- `src/pages/flows/HybridFlow.tsx` - Added Flow Credentials section

---

## [2.x.x] - Previous versions
*Previous changelog entries...*


