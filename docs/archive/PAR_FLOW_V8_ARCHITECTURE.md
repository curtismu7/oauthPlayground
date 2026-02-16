# PAR Flow V8 - Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PingOnePARFlowV8.tsx                        │
│                      (Main Component)                           │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  usePARFlowState │              │ usePAROperations │        │
│  │                  │              │                  │        │
│  │  • flowState     │              │  • generatePKCE  │        │
│  │  • credentials   │              │  • pushAuthReq   │        │
│  │  • pkceCodes     │              │  • exchangeTokens│        │
│  │  • tokens        │              │  • fetchUserInfo │        │
│  │  • stepCompletion│              │                  │        │
│  └──────────────────┘              └──────────────────┘        │
│           │                                  │                  │
│           │                                  │                  │
│           ▼                                  ▼                  │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  sessionStorage  │              │   fetch API      │        │
│  │  (persistence)   │              │   (HTTP calls)   │        │
│  └──────────────────┘              └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │   Backend API    │
                                    │   /api/par       │
                                    └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │   PingOne        │
                                    │   PAR Endpoint   │
                                    └──────────────────┘
```

---

## Component Structure

```
PingOnePARFlowV8
├── Header
│   ├── VersionBadge
│   ├── Title
│   ├── Subtitle
│   └── StepNumber
│
├── Content (Step-based)
│   ├── Step 0: Configuration
│   │   ├── VariantSelector
│   │   ├── InfoBox (What is PAR?)
│   │   └── CredentialsForm
│   │
│   ├── Step 1: PKCE Generation
│   │   ├── InfoBox (PKCE explanation)
│   │   ├── GenerateButton
│   │   └── PKCEDisplay
│   │
│   ├── Step 2: Push Authorization Request
│   │   ├── InfoBox (PAR explanation)
│   │   ├── CodeBlock (request preview)
│   │   ├── PushButton
│   │   └── ResponseDisplay
│   │
│   ├── Step 3: User Authorization
│   │   ├── InfoBox (authorization explanation)
│   │   ├── CodeBlock (auth URL)
│   │   └── AuthorizeButton
│   │
│   ├── Step 4: Token Exchange
│   │   ├── InfoBox (token exchange explanation)
│   │   ├── ExchangeButton
│   │   └── TokenDisplay
│   │
│   └── Step 5: Complete
│       ├── SuccessBox
│       ├── AccomplishmentsList
│       └── NextStepsList
│
└── Navigation
    ├── PreviousButton
    ├── NextButton
    └── ResetButton
```

---

## Data Flow

### 1. State Management Flow

```
User Action
    │
    ▼
Component Handler
    │
    ▼
usePARFlowState Hook
    │
    ├─► Update State
    │   (in memory)
    │
    └─► Save to sessionStorage
        (persistence)
```

### 2. API Operation Flow

```
User Action
    │
    ▼
Component Handler
    │
    ▼
usePAROperations Hook
    │
    ├─► Prepare Request
    │   (build payload)
    │
    ├─► Call API
    │   (fetch)
    │
    ├─► Handle Response
    │   (parse JSON)
    │
    └─► Return Data
        (to component)
```

### 3. Complete PAR Flow

```
Step 0: Configuration
    │
    ├─► User enters credentials
    ├─► Select OAuth/OIDC variant
    └─► Click Next
        │
        ▼
Step 1: PKCE Generation
    │
    ├─► Click "Generate PKCE"
    ├─► usePAROperations.generatePKCE()
    ├─► Receive codes
    ├─► usePARFlowState.updatePKCE()
    └─► Mark step complete
        │
        ▼
Step 2: Push Authorization Request
    │
    ├─► Click "Push Authorization Request"
    ├─► usePAROperations.pushAuthorizationRequest()
    │   │
    │   ├─► POST /api/par
    │   │   │
    │   │   └─► PingOne PAR endpoint
    │   │       │
    │   │       └─► Returns request_uri
    │   │
    │   └─► Receive response
    │
    ├─► usePARFlowState.setPARRequestUri()
    └─► Mark step complete
        │
        ▼
Step 3: User Authorization
    │
    ├─► Click "Authorize with PingOne"
    ├─► usePAROperations.generateAuthorizationUrl()
    ├─► Redirect to PingOne
    │   │
    │   └─► User authenticates
    │       │
    │       └─► Redirect back with code
    │
    ├─► Detect code from URL
    ├─► usePARFlowState.setAuthCode()
    └─► Mark step complete
        │
        ▼
Step 4: Token Exchange
    │
    ├─► Click "Exchange Code for Tokens"
    ├─► usePAROperations.exchangeCodeForTokens()
    │   │
    │   ├─► POST to token endpoint
    │   │   (with code + PKCE verifier)
    │   │
    │   └─► Receive tokens
    │
    ├─► usePARFlowState.updateTokens()
    ├─► If OIDC: fetchUserInfo()
    └─► Mark step complete
        │
        ▼
Step 5: Complete
    │
    └─► Show success + next steps
```

---

## Hook Architecture

### usePARFlowState

```typescript
usePARFlowState()
│
├── State
│   ├── flowState: PARFlowState
│   ├── credentials: FlowCredentials
│   ├── pkceCodes: PKCECodes
│   ├── tokens: TokenResponse | null
│   ├── userInfo: UserInfo | null
│   └── stepCompletion: StepCompletionState
│
├── Updates
│   ├── updateFlowState()
│   ├── setCurrentStep()
│   ├── setFlowVariant()
│   ├── setPARRequestUri()
│   ├── setAuthCode()
│   ├── updateCredentials()
│   ├── updatePKCE()
│   ├── updateTokens()
│   ├── updateUserInfo()
│   └── markStepCompleted()
│
├── Computed
│   ├── isStepCompleted()
│   └── canGoToStep()
│
└── Actions
    ├── goToStep()
    └── resetFlow()
```

### usePAROperations

```typescript
usePAROperations()
│
├── State
│   ├── isLoading: boolean
│   └── error: string | null
│
└── Operations
    ├── generatePKCE()
    │   └── Returns: PKCECodes
    │
    ├── pushAuthorizationRequest()
    │   ├── Input: credentials, pkceCodes, additionalParams
    │   └── Returns: PARResponse
    │
    ├── generateAuthorizationUrl()
    │   ├── Input: credentials, requestUri
    │   └── Returns: string (URL)
    │
    ├── exchangeCodeForTokens()
    │   ├── Input: credentials, authCode, pkceCodes
    │   └── Returns: TokenResponse
    │
    └── fetchUserInfo()
        ├── Input: credentials, accessToken
        └── Returns: UserInfo
```

---

## Type System

```typescript
// Core Types
FlowVariant = 'oauth' | 'oidc'

PARFlowState {
  currentStep: number
  flowVariant: FlowVariant
  collapsedSections: Record<string, boolean>
  parRequestUri: string | null
  parExpiresIn: number | null
  authCode: string | null
}

FlowCredentials {
  environmentId: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string
  // ... other fields
}

PKCECodes {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: string
}

PARRequest {
  clientId: string
  clientSecret?: string
  environmentId: string
  responseType: string
  redirectUri: string
  scope: string
  state: string
  nonce?: string
  codeChallenge?: string
  codeChallengeMethod?: string
  [key: string]: any
}

PARResponse {
  request_uri: string
  expires_in: number
}

TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  id_token?: string
  scope?: string
}

UserInfo {
  sub: string
  name?: string
  email?: string
  // ... other claims
}

StepCompletionState {
  [step: number]: boolean
}
```

---

## Comparison with V7

### V7 Architecture (Old) ❌

```
PingOnePARFlowV7.tsx (2814 lines)
│
├── PARService (class)
│   ├── generatePARRequest()
│   ├── buildPARRequestBody()
│   ├── buildPARHeaders()
│   ├── generateClientSecretJWT()
│   └── generatePrivateKeyJWT()
│
├── Mixed State (20+ useState)
│   ├── parResponse
│   ├── pkceCodes
│   ├── completedActions
│   ├── currentStep
│   └── ... many more
│
└── Monolithic Component
    ├── All logic in one file
    ├── Hard to test
    └── Hard to maintain
```

### V8 Architecture (New) ✅

```
PingOnePARFlowV8/
│
├── types/
│   └── parFlowTypes.ts
│
├── constants/
│   └── parFlowConstants.ts
│
├── hooks/
│   ├── usePARFlowState.ts (state)
│   └── usePAROperations.ts (API)
│
└── PingOnePARFlowV8.tsx (component)
    ├── Clean separation
    ├── Easy to test
    └── Easy to maintain
```

---

## Security Flow

```
1. PKCE Generation
   ├── Generate random verifier (43 chars)
   ├── Hash with SHA256
   └── Base64URL encode → challenge

2. PAR Request
   ├── Client authenticates (client_secret)
   ├── Send all params to PAR endpoint
   ├── Receive request_uri
   └── request_uri expires in 600s

3. Authorization
   ├── Redirect with request_uri only
   ├── No sensitive params in URL
   ├── User authenticates
   └── Receive authorization code

4. Token Exchange
   ├── Send code + PKCE verifier
   ├── Server verifies:
   │   ├── Code is valid
   │   ├── PKCE verifier matches challenge
   │   └── Client is authenticated
   └── Receive tokens

5. Token Usage
   ├── Access token for API calls
   ├── ID token for user identity (OIDC)
   └── Refresh token for renewal
```

---

## Performance Optimization

```
Component Level
├── useCallback for handlers
├── useMemo for computed values
└── Lazy loading (future)

State Level
├── Centralized state (less re-renders)
├── sessionStorage persistence
└── Selective updates

Network Level
├── Single PAR request
├── Efficient token exchange
└── Cached user info

Bundle Level
├── Code splitting (future)
├── Tree shaking
└── Minification
```

---

## Error Handling

```
API Errors
├── Catch in usePAROperations
├── Set error state
├── Display to user
└── Log for debugging

Validation Errors
├── Check credentials
├── Check PKCE codes
├── Check step completion
└── Prevent invalid actions

Network Errors
├── Timeout handling
├── Retry logic (future)
└── Offline detection (future)

State Errors
├── Invalid state transitions
├── Missing required data
└── Corrupted sessionStorage
```

---

## Testing Strategy

```
Unit Tests
├── usePARFlowState
│   ├── State updates
│   ├── Step completion
│   └── Navigation
│
└── usePAROperations
    ├── PKCE generation
    ├── PAR request
    ├── Token exchange
    └── User info fetch

Integration Tests
├── Complete flow
├── OAuth variant
├── OIDC variant
└── Error scenarios

E2E Tests
├── User journey
├── Browser compatibility
└── Mobile responsiveness

Accessibility Tests
├── Keyboard navigation
├── Screen reader
└── WCAG compliance
```

---

## Deployment Architecture

```
Development
├── Local development server
├── Hot module replacement
└── Source maps

Staging
├── Production build
├── Feature flags
└── Monitoring

Production
├── CDN distribution
├── Caching strategy
├── Error tracking
└── Analytics
```

---

## Summary

The V8 architecture is:

✅ **Modular** - Clear separation of concerns
✅ **Testable** - Hooks can be tested independently
✅ **Maintainable** - Easy to understand and modify
✅ **Scalable** - Can be extended with new features
✅ **Performant** - Optimized for speed and size
✅ **Secure** - Follows OAuth/OIDC best practices
✅ **Documented** - Comprehensive documentation

This architecture follows the Authorization Code Flow V7.1 pattern and represents the standard for implementing OAuth/OIDC flows in the application.
