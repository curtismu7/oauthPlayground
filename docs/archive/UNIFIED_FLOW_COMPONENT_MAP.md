# Unified Flow Component Map

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    UnifiedOAuthFlowV8U                     │
│                     (Main Container)                        │
│  • Flow Selection (Spec Version + Flow Type)               │
│  • URL Routing & Params                                    │
│  • Credential Management                                   │
│  • Navigation Coordination                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  UnifiedFlowSteps                           │
│                   (Step Renderer)                           │
│  • Dynamic Step Rendering                                  │
│  • Flow-Specific Logic                                     │
│  • API Call Coordination                                   │
│  • Token Display                                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              UnifiedFlowIntegrationV8U                      │
│                    (Facade)                                 │
│  • Routes to V8 Services                                    │
│  • Unified Credential Interface                            │
│  • API Call Delegation                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    V8 Services                              │
│  • OAuthIntegrationService                               │
│  • ClientCredentialsIntegrationService                   │
│  • ImplicitFlowIntegrationService                         │
│  • DeviceCodeIntegrationService                           │
│  • HybridFlowIntegrationService                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  PingOne APIs                               │
│  • OAuth 2.0/OIDC Endpoints                                │
│  • Token Operations                                        │
│  • User Info                                               │
└─────────────────────────────────────────────────────────────┘
```

## Service Dependencies

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ SpecVersionSrv │────│ UnifiedFlowOpts │────│ ComplianceRules │
│                 │    │      V8         │    │                 │
│ • Flow Matrix   │    │ • Field Vis     │    │ • PKCE Required │
│ • Validation    │    │ • Checkbox Av   │    │ • HTTPS Only    │
│ • Spec Config   │    │ • Warnings      │    │ • Flow Allowed  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                UnifiedOAuthFlowV8U                           │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ CredentialsSrv│────│ FlowSettingsV8U │────│ PKCEStorageV8U  │
│                 │    │                 │    │                 │
│ • Persistence   │    │ • User Prefs    │    │ • Code Gen      │
│ • Env ID Share  │    │ • Last Spec     │    │ • Challenge     │
│ • Load/Save     │    │ • Flow History  │    │ • Verify        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Flow Type Mapping

```
Flow Type Selection → UnifiedFlowIntegrationV8U → V8 Service
──────────────────────────────────────────────────────────────
oauth-authz      → OAuthIntegrationService      → /oauth/authz
implicit         → ImplicitFlowIntegrationService → /oauth/implicit
client-credentials→ ClientCredentialsIntegrationService → /oauth/token
device-code      → DeviceCodeIntegrationService   → /oauth/device
hybrid           → HybridFlowIntegrationService    → /oauth/hybrid
```

## State Management Flow

```
User Input
    │
    ▼
┌─────────────────┐
│ URL Params      │ ←── Router Navigation
│ (flowType, step)│
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ SpecVersionSrv│ ←── Validate Flow Availability
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ UnifiedFlowOpts │ ←── Determine UI Visibility
│      V8         │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ UnifiedFlowSteps│ ←── Render Flow-Specific Steps
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ API Calls       │ ←── Via UnifiedFlowIntegrationV8U
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Token Display   │ ←── Show Results
│                 │
└─────────────────┘
```

## Navigation Integration

```
┌─────────────────┐
│ MFANavigation  │
│                 │
│ • MFA Hub        │
│ • Device Reg     │
│ • Device Mgmt    │
│ • Reporting      │
│ • Back to Main   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Unified Pages   │
│                 │
│ • UnifiedOAuth   │
│ • SPIFFE Flow    │
│ • Token Display  │
└─────────────────┘
```

## API Display Integration

```
┌─────────────────┐
│ SuperSimpleApi   │
│    Display     │
│                 │
│ • Call Tracking  │
│ • Response Display│
│ • Debug Info     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ All V8U Pages   │
│                 │
│ • Unified Flow  │
│ • SPIFFE Flow   │
│ • Token Viewer  │
└─────────────────┘
```

## Error Handling Flow

```
Error Occurs
    │
    ▼
┌─────────────────┐
│ Validation       │ ←── SpecVersionService
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Error Display   │ ←── ErrorDisplayWithRetry
│                 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Recovery Options│
│                 │
└─────────────────┘
```
