# Unified Flow Architecture (V8U)

## Overview

The Unified Flow (V8U) is a single interface that handles all OAuth 2.0, OAuth 2.1, and OpenID Connect flows using real PingOne APIs. It provides a consistent user experience while adapting to the requirements of different specifications and flow types.

## Core Components

### 1. Main Container: `UnifiedOAuthFlowV8U.tsx`
**Purpose**: Main orchestrator for all unified flows
**Responsibilities**:
- Flow type and spec version selection
- URL routing and parameter extraction
- Credential management and persistence
- Step navigation coordination
- Compliance validation

### 2. Step Renderer: `UnifiedFlowSteps.tsx`
**Purpose**: Renders flow-specific steps dynamically
**Responsibilities**:
- Adapts UI based on flow type and spec version
- Handles flow-specific API calls
- Manages step validation and progression
- Token display and operations

### 3. Integration Service: `unifiedFlowIntegrationV8U.ts`
**Purpose**: Facade pattern - delegates to V8 services
**Responsibilities**:
- Routes calls to appropriate V8 integration services
- Provides unified credential interface
- Maintains compatibility with V8 APIs

## Service Architecture

### Core Services

#### `SpecVersionServiceV8`
- **Purpose**: Manages OAuth/OIDC specification versions
- **Features**:
  - Flow availability per spec version
  - Compliance rules enforcement
  - Validation and error reporting

#### `UnifiedFlowOptionsServiceV8`
- **Purpose**: Determines UI visibility and options
- **Features**:
  - Field visibility per spec/flow combination
  - Checkbox availability (PKCE, refresh tokens, etc.)
  - Compliance warnings generation

#### `UnifiedFlowIntegrationV8U`
- **Purpose**: Integration facade for V8 services
- **Delegates to**:
  - `OAuthIntegrationServiceV8`
  - `ClientCredentialsIntegrationServiceV8`
  - `ImplicitFlowIntegrationServiceV8`
  - `DeviceCodeIntegrationServiceV8`
  - `HybridFlowIntegrationServiceV8`

### Supporting Services

#### `CredentialsServiceV8`
- Credential persistence and loading
- Environment ID sharing across flows

#### `FlowSettingsServiceV8U`
- User preferences per flow type
- Last used spec version tracking

#### `PKCEStorageServiceV8U`
- PKCE code generation and storage
- Challenge verification management

## Flow Types and Specifications

### Supported Specifications
- **OAuth 2.0**: Legacy OAuth flows
- **OAuth 2.1**: Modern OAuth with enhanced security
- **OpenID Connect**: OIDC-specific flows with ID tokens

### Supported Flow Types
| Flow Type | OAuth 2.0 | OAuth 2.1 | OIDC | Description |
|-----------|-----------|-----------|------|-------------|
| Authorization Code | ✅ | ✅ | ✅ | Server-side web apps |
| Implicit | ✅ | ❌ | ✅ | Deprecated, SPA apps |
| Client Credentials | ✅ | ✅ | ❌ | Machine-to-machine |
| Device Code | ✅ | ✅ | ❌ | Device/input-limited |
| Hybrid | ❌ | ❌ | ✅ | Hybrid server/mobile |
| ROPC | ❌ | ❌ | ❌ | Not supported by PingOne |

## Data Flow

```
User Input → UnifiedOAuthFlowV8U → SpecVersionServiceV8
                                    ↓
                            UnifiedFlowOptionsServiceV8
                                    ↓
                            UnifiedFlowSteps.tsx
                                    ↓
                            UnifiedFlowIntegrationV8U
                                    ↓
                              V8 Services
                                    ↓
                            PingOne APIs
```

## Key Patterns

### 1. Facade Pattern
`UnifiedFlowIntegrationV8U` acts as a facade, providing a single interface to multiple V8 services.

### 2. Strategy Pattern
Different flow types are handled as strategies within `UnifiedFlowSteps.tsx`.

### 3. Specification Awareness
All components are spec-version aware and adapt behavior accordingly.

### 4. Compliance Enforcement
Built-in validation ensures configurations comply with selected specifications.

## Configuration Management

### Field Visibility
Determined by `UnifiedFlowOptionsServiceV8` based on:
- Selected specification version
- Flow type requirements
- Compliance rules

### Credential Persistence
- Managed by `CredentialsServiceV8`
- Shared across flows via environment ID
- Per-flow-type settings via `FlowSettingsServiceV8U`

## Error Handling

### Validation Errors
- Spec version compliance
- Flow availability
- Required field validation

### Runtime Errors
- API call failures
- Network issues
- Invalid responses

### User Experience
- Inline validation feedback
- Compliance warnings
- Error recovery options

## Integration Points

### With V8 Services
- Direct delegation for API calls
- Shared credential management
- Common token operations

### With Navigation
- MFANavigationV8 integration
- Cross-flow navigation
- Hub-based navigation

### With API Display
- SuperSimpleApiDisplayV8 integration
- Real-time API call tracking
- Debugging support

## Extensibility

### Adding New Flow Types
1. Update `SpecVersionServiceV8` with flow availability
2. Add integration service to `UnifiedFlowIntegrationV8U`
3. Implement flow steps in `UnifiedFlowSteps.tsx`
4. Update field visibility in `UnifiedFlowOptionsServiceV8`

### Adding New Specifications
1. Define spec version in `SpecVersionServiceV8`
2. Configure compliance rules
3. Update flow availability matrix
4. Add spec-specific validation

## Security Considerations

### PKCE Enforcement
- Required for OAuth 2.1 public clients
- Optional but recommended for OAuth 2.0
- Automatic code generation and verification

### Token Security
- Secure storage via V8 services
- Proper token validation
- Automatic token refresh

### Compliance
- HTTPS enforcement
- Scope validation
- Redirect URI validation

## Performance Optimizations

### Lazy Loading
- Flow-specific components loaded on demand
- API calls made only when needed

### Caching
- Credential caching
- Spec version caching
- Flow options caching

### Debouncing
- Input validation debouncing
- API call debouncing
- State update optimization
