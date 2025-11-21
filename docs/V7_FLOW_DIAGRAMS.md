# V7 Flow Diagrams

**Visual reference for V7 OAuth/OIDC flows**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        V7 Flow Architecture                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  User Interface  │
│  (React Flow)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  V7FlowTemplate  │  ◄─── Standardized template for all flows
└────────┬─────────┘
         │
         ├─────────────────────────────────────────────────┐
         │                                                 │
         ▼                                                 ▼
┌──────────────────┐                            ┌──────────────────┐
│  FlowUIService   │                            │  V7SharedService │
│  (UI Components) │                            │  (Business Logic)│
└──────────────────┘                            └────────┬─────────┘
                                                         │
                    ┌────────────────────────────────────┼────────────────┐
                    │                                    │                │
                    ▼                                    ▼                ▼
         ┌──────────────────┐              ┌──────────────────┐  ┌──────────────────┐
         │  ID Token        │              │  Parameter       │  │  Error           │
         │  Validation      │              │  Validation      │  │  Handling        │
         └──────────────────┘              └──────────────────┘  └──────────────────┘
```

---

## V7 Flow Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     V7 Flow Lifecycle                            │
└─────────────────────────────────────────────────────────────────┘

1. INITIALIZATION
   │
   ├─► Load V7FlowTemplate
   ├─► Initialize V7SharedService
   ├─► Setup compliance features
   └─► Render step 0
   
2. STEP EXECUTION
   │
   ├─► User interacts with step
   ├─► Validate inputs (V7SharedService.ParameterValidation)
   ├─► Execute step logic
   ├─► Handle errors (V7SharedService.ErrorHandling)
   └─► Update UI state
   
3. NAVIGATION
   │
   ├─► Check canNavigateNext()
   ├─► Update currentStep
   ├─► Render next step content
   └─► Scroll to top
   
4. COMPLETION
   │
   ├─► Display results
   ├─► Show compliance status
   ├─► Offer reset/start over
   └─► Log completion
```

---

## OAuth 2.0 Authorization Code Flow V7

```
┌─────────────────────────────────────────────────────────────────┐
│          OAuth 2.0 Authorization Code Flow (with PKCE)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────┐                                          ┌─────────────┐
│ Client  │                                          │   Auth      │
│  (V7)   │                                          │   Server    │
└────┬────┘                                          └──────┬──────┘
     │                                                      │
     │ STEP 1: Setup Credentials                           │
     │ ─────────────────────────                           │
     │ • Configure client_id, client_secret                │
     │ • Set redirect_uri                                  │
     │ • Choose scopes                                     │
     │                                                      │
     │ STEP 2: Generate PKCE                               │
     │ ────────────────────                                │
     │ • Generate code_verifier (random)                   │
     │ • Create code_challenge = SHA256(code_verifier)     │
     │ • Set code_challenge_method = S256                  │
     │                                                      │
     │ STEP 3: Build Authorization URL                     │
     │ ────────────────────────────                        │
     │ • Validate parameters ──────────────────────┐       │
     │                                             │       │
     │ ┌───────────────────────────────────────────▼─┐     │
     │ │ V7SharedService.ParameterValidation       │     │
     │ │ • Check required params                   │     │
     │ │ • Validate formats                        │     │
     │ │ • Return validation result                │     │
     │ └───────────────────────────────────────────┬─┘     │
     │                                             │       │
     │ • Build URL with validated params ◄─────────┘       │
     │                                                      │
     │ STEP 4: Redirect to Authorization                   │
     │ ──────────────────────────────────                  │
     │                                                      │
     │ GET /authorize?                                      │
     │   response_type=code&                                │
     │   client_id=xxx&                                     │
     │   redirect_uri=xxx&                                  │
     │   scope=openid profile&                              │
     │   state=random&                                      │
     │   code_challenge=xxx&                                │
     │   code_challenge_method=S256 ───────────────────────►│
     │                                                      │
     │                                    User authenticates│
     │                                    and authorizes    │
     │                                                      │
     │ STEP 5: Receive Authorization Code                  │
     │ ───────────────────────────────────                 │
     │                                                      │
     │◄─────────────────────────────────────────────────────│
     │ Redirect: /callback?code=xxx&state=xxx              │
     │                                                      │
     │ • Validate state parameter                          │
     │ • Extract authorization code                        │
     │                                                      │
     │ STEP 6: Exchange Code for Tokens                    │
     │ ─────────────────────────────────                   │
     │                                                      │
     │ POST /token                                          │
     │   grant_type=authorization_code&                     │
     │   code=xxx&                                          │
     │   redirect_uri=xxx&                                  │
     │   client_id=xxx&                                     │
     │   client_secret=xxx&                                 │
     │   code_verifier=xxx ─────────────────────────────────►│
     │                                                      │
     │                                    Verify PKCE:      │
     │                                    SHA256(verifier)  │
     │                                    == challenge      │
     │                                                      │
     │◄─────────────────────────────────────────────────────│
     │ {                                                    │
     │   "access_token": "...",                             │
     │   "token_type": "Bearer",                            │
     │   "expires_in": 3600,                                │
     │   "refresh_token": "...",                            │
     │   "scope": "openid profile"                          │
     │ }                                                    │
     │                                                      │
     │ STEP 7: Display Results                             │
     │ ───────────────────                                 │
     │ • Show tokens                                       │
     │ • Display compliance status                         │
     │ • Offer token introspection                         │
     │                                                      │
```

---

## OIDC Authorization Code Flow V7

```
┌─────────────────────────────────────────────────────────────────┐
│        OpenID Connect Authorization Code Flow (V7)               │
└─────────────────────────────────────────────────────────────────┘

Similar to OAuth flow above, but with additional OIDC features:

STEP 6b: Token Response includes ID Token
─────────────────────────────────────────
│◄─────────────────────────────────────────────────────│
│ {                                                    │
│   "access_token": "...",                             │
│   "token_type": "Bearer",                            │
│   "expires_in": 3600,                                │
│   "id_token": "eyJhbGc...",  ◄─── OIDC ID Token     │
│   "refresh_token": "..."                             │
│ }                                                    │
│                                                      │
│ STEP 7: Validate ID Token                           │
│ ─────────────────────                               │
│                                                      │
│ ┌────────────────────────────────────────────┐      │
│ │ V7SharedService.IDTokenValidation          │      │
│ │                                            │      │
│ │ 1. Decode JWT                              │      │
│ │ 2. Verify signature (JWKS)                 │      │
│ │ 3. Validate issuer                         │      │
│ │ 4. Validate audience                       │      │
│ │ 5. Check expiration                        │      │
│ │ 6. Verify nonce                            │      │
│ │ 7. Extract claims                          │      │
│ │                                            │      │
│ │ Returns: {                                 │      │
│ │   isValid: true,                           │      │
│ │   claims: {                                │      │
│ │     sub: "user-id",                        │      │
│ │     email: "user@example.com",             │      │
│ │     name: "User Name"                      │      │
│ │   }                                        │      │
│ │ }                                          │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
│ STEP 8: Fetch UserInfo (Optional)                   │
│ ──────────────────────────────                      │
│                                                      │
│ GET /userinfo                                        │
│   Authorization: Bearer {access_token} ──────────────►│
│                                                      │
│◄─────────────────────────────────────────────────────│
│ {                                                    │
│   "sub": "user-id",                                  │
│   "email": "user@example.com",                       │
│   "name": "User Name",                               │
│   "picture": "https://..."                           │
│ }                                                    │
```

---

## Client Credentials Flow V7

```
┌─────────────────────────────────────────────────────────────────┐
│            OAuth 2.0 Client Credentials Flow (V7)                │
└─────────────────────────────────────────────────────────────────┘

┌─────────┐                                          ┌─────────────┐
│ Client  │                                          │   Auth      │
│  (V7)   │                                          │   Server    │
└────┬────┘                                          └──────┬──────┘
     │                                                      │
     │ STEP 1: Setup Credentials                           │
     │ ─────────────────────────                           │
     │ • Configure client_id, client_secret                │
     │ • Set token_endpoint                                │
     │ • Choose scopes                                     │
     │ • Select auth method (client_secret_basic/post)     │
     │                                                      │
     │ STEP 2: Request Token                               │
     │ ────────────────────                                │
     │                                                      │
     │ POST /token                                          │
     │   grant_type=client_credentials&                     │
     │   scope=api:read api:write&                          │
     │   client_id=xxx&                                     │
     │   client_secret=xxx ─────────────────────────────────►│
     │                                                      │
     │                                    Authenticate      │
     │                                    client            │
     │                                                      │
     │◄─────────────────────────────────────────────────────│
     │ {                                                    │
     │   "access_token": "...",                             │
     │   "token_type": "Bearer",                            │
     │   "expires_in": 3600,                                │
     │   "scope": "api:read api:write"                      │
     │ }                                                    │
     │                                                      │
     │ STEP 3: Use Access Token                            │
     │ ───────────────────────                             │
     │                                                      │
     │ GET /api/resource                                    │
     │   Authorization: Bearer {access_token} ──────────────►│
     │                                                      │
     │◄─────────────────────────────────────────────────────│
     │ { "data": "..." }                                    │
     │                                                      │
```

---

## Device Authorization Flow V7

```
┌─────────────────────────────────────────────────────────────────┐
│           OAuth 2.0 Device Authorization Flow (V7)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────┐                    ┌──────────┐         ┌─────────────┐
│ Device  │                    │  User    │         │   Auth      │
│  (V7)   │                    │  Browser │         │   Server    │
└────┬────┘                    └─────┬────┘         └──────┬──────┘
     │                               │                     │
     │ STEP 1: Request Device Code   │                     │
     │ ───────────────────────────   │                     │
     │                               │                     │
     │ POST /device/code             │                     │
     │   client_id=xxx ──────────────┼─────────────────────►│
     │                               │                     │
     │◄──────────────────────────────┼─────────────────────│
     │ {                             │                     │
     │   "device_code": "xxx",       │                     │
     │   "user_code": "ABCD-EFGH",   │                     │
     │   "verification_uri": "...",  │                     │
     │   "expires_in": 1800,         │                     │
     │   "interval": 5               │                     │
     │ }                             │                     │
     │                               │                     │
     │ STEP 2: Display User Code     │                     │
     │ ─────────────────────────     │                     │
     │                               │                     │
     │ Display:                      │                     │
     │ "Visit: https://device.auth"  │                     │
     │ "Enter code: ABCD-EFGH"       │                     │
     │ [QR Code]                     │                     │
     │                               │                     │
     │                               │ User visits URL     │
     │                               │ ────────────────────►│
     │                               │                     │
     │                               │ GET /device         │
     │                               │                     │
     │                               │◄────────────────────│
     │                               │ Enter code page     │
     │                               │                     │
     │                               │ POST /device/verify │
     │                               │   user_code=ABCD    │
     │                               │ ────────────────────►│
     │                               │                     │
     │                               │ Authenticate        │
     │                               │ and authorize       │
     │                               │                     │
     │ STEP 3: Poll for Token        │                     │
     │ ──────────────────────        │                     │
     │                               │                     │
     │ (Every 5 seconds)             │                     │
     │                               │                     │
     │ POST /token                   │                     │
     │   grant_type=device_code&     │                     │
     │   device_code=xxx&            │                     │
     │   client_id=xxx ──────────────┼─────────────────────►│
     │                               │                     │
     │◄──────────────────────────────┼─────────────────────│
     │ { "error": "authorization_pending" }                │
     │                               │                     │
     │ (Continue polling...)         │                     │
     │                               │                     │
     │                               │ User approves       │
     │                               │                     │
     │ POST /token                   │                     │
     │   grant_type=device_code&     │                     │
     │   device_code=xxx&            │                     │
     │   client_id=xxx ──────────────┼─────────────────────►│
     │                               │                     │
     │◄──────────────────────────────┼─────────────────────│
     │ {                             │                     │
     │   "access_token": "...",      │                     │
     │   "token_type": "Bearer",     │                     │
     │   "expires_in": 3600          │                     │
     │ }                             │                     │
     │                               │                     │
     │ STEP 4: Success!              │                     │
     │                               │                     │
```

---

## CIBA Flow V7

```
┌─────────────────────────────────────────────────────────────────┐
│    OIDC Client Initiated Backchannel Authentication (V7)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────┐                    ┌──────────┐         ┌─────────────┐
│ Client  │                    │  User    │         │   Auth      │
│  (V7)   │                    │  Device  │         │   Server    │
└────┬────┘                    └─────┬────┘         └──────┬──────┘
     │                               │                     │
     │ STEP 1: Initiate Authentication                     │
     │ ───────────────────────────────                     │
     │                               │                     │
     │ POST /bc-authorize            │                     │
     │   scope=openid&               │                     │
     │   login_hint=user@example.com&│                     │
     │   binding_message=xxx&        │                     │
     │   client_notification_token=xxx ─────────────────────►│
     │                               │                     │
     │                               │ Push notification   │
     │                               │ to user device      │
     │                               │ ────────────────────►│
     │                               │                     │
     │◄──────────────────────────────┼─────────────────────│
     │ {                             │                     │
     │   "auth_req_id": "xxx",       │                     │
     │   "expires_in": 120,          │                     │
     │   "interval": 2               │                     │
     │ }                             │                     │
     │                               │                     │
     │                               │ User receives       │
     │                               │ notification        │
     │                               │                     │
     │                               │ "Approve login?"    │
     │                               │ [Approve] [Deny]    │
     │                               │                     │
     │ STEP 2: Poll for Result       │                     │
     │ ───────────────────────       │                     │
     │                               │                     │
     │ (Every 2 seconds)             │                     │
     │                               │                     │
     │ POST /token                   │                     │
     │   grant_type=ciba&            │                     │
     │   auth_req_id=xxx&            │                     │
     │   client_id=xxx ──────────────┼─────────────────────►│
     │                               │                     │
     │◄──────────────────────────────┼─────────────────────│
     │ { "error": "authorization_pending" }                │
     │                               │                     │
     │                               │ User approves       │
     │                               │ ────────────────────►│
     │                               │                     │
     │ POST /token                   │                     │
     │   grant_type=ciba&            │                     │
     │   auth_req_id=xxx&            │                     │
     │   client_id=xxx ──────────────┼─────────────────────►│
     │                               │                     │
     │◄──────────────────────────────┼─────────────────────│
     │ {                             │                     │
     │   "access_token": "...",      │                     │
     │   "id_token": "...",          │                     │
     │   "token_type": "Bearer",     │                     │
     │   "expires_in": 3600          │                     │
     │ }                             │                     │
     │                               │                     │
```

---

## V7 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  V7 Error Handling Flow                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Flow Executes│
└──────┬───────┘
       │
       ▼
   ┌───────┐
   │ Error?│
   └───┬───┘
       │
       ├─── No ──────────────────────────────► Success Path
       │
       └─── Yes
            │
            ▼
   ┌────────────────────────────────────────┐
   │ V7SharedService.ErrorHandling          │
   │                                        │
   │ 1. Identify error type:                │
   │    • OAuth error (RFC 6749)            │
   │    • OIDC error (OIDC Core)            │
   │    • Network error                     │
   │    • Validation error                  │
   │                                        │
   │ 2. Create standardized response:       │
   │    {                                   │
   │      error: "invalid_request",         │
   │      error_description: "...",         │
   │      error_uri: "https://..."          │
   │    }                                   │
   │                                        │
   │ 3. Log error with context              │
   │                                        │
   │ 4. Update error statistics             │
   └────────────────┬───────────────────────┘
                    │
                    ▼
   ┌────────────────────────────────────────┐
   │ Display Error to User                  │
   │                                        │
   │ • Show toast notification              │
   │ • Display in UI (InfoBox)              │
   │ • Provide recovery options             │
   │ • Link to documentation                │
   └────────────────────────────────────────┘
```

---

## V7 Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  V7 Parameter Validation Flow                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ User Input       │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ V7SharedService.ParameterValidation                    │
│                                                        │
│ 1. Check Required Parameters                          │
│    ├─► client_id present?                             │
│    ├─► redirect_uri present?                          │
│    └─► response_type present?                         │
│                                                        │
│ 2. Validate Formats                                   │
│    ├─► redirect_uri is valid URL?                     │
│    ├─► scope format correct?                          │
│    └─► state is random string?                        │
│                                                        │
│ 3. Check Specification Compliance                     │
│    ├─► response_type valid for flow?                  │
│    ├─► PKCE required? (S256 recommended)              │
│    └─► Scope includes required values?                │
│                                                        │
│ 4. Generate Warnings                                  │
│    ├─► Using deprecated features?                     │
│    ├─► Missing recommended parameters?                │
│    └─► Security best practices?                       │
│                                                        │
│ 5. Return Result                                      │
│    {                                                  │
│      isValid: boolean,                                │
│      errors: string[],                                │
│      warnings: string[]                               │
│    }                                                  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ├─── Valid ──────────► Continue Flow
                 │
                 └─── Invalid ────────► Show Errors
```

---

## Component Hierarchy

```
V7 Flow Component Hierarchy
═══════════════════════════

V7FlowTemplate
├── Container
│   └── ContentWrapper
│       ├── FlowHeader
│       │   ├── Title
│       │   ├── Description
│       │   └── Metadata
│       │
│       ├── ComplianceStatus (Collapsible)
│       │   ├── Compliance Score
│       │   ├── Missing Features
│       │   └── Recommendations
│       │
│       ├── ValidationResults (Collapsible)
│       │   ├── Validation Status
│       │   ├── Errors List
│       │   └── Warnings List
│       │
│       ├── ErrorStatistics (Collapsible)
│       │   ├── Total Errors
│       │   └── Errors by Code
│       │
│       ├── MainCard
│       │   ├── StepHeader
│       │   │   ├── StepHeaderLeft
│       │   │   │   ├── VersionBadge (V7)
│       │   │   │   ├── StepHeaderTitle
│       │   │   │   └── StepHeaderSubtitle
│       │   │   └── StepHeaderRight
│       │   │       ├── StepNumber (01)
│       │   │       └── StepTotal (of 5)
│       │   │
│       │   └── StepContentWrapper
│       │       └── {renderStepContent(currentStep)}
│       │           ├── InfoBox
│       │           ├── Form Fields
│       │           ├── Buttons
│       │           ├── CodeBlock
│       │           └── Results Display
│       │
│       └── StepNavigationButtons
│           ├── Previous Button
│           ├── Next Button
│           ├── Reset Button
│           └── Start Over Button
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      V7 Data Flow                                │
└─────────────────────────────────────────────────────────────────┘

User Input
    │
    ▼
┌─────────────────┐
│ React State     │
│ (credentials,   │
│  tokens, etc.)  │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│ Validation      │              │ Execution       │
│ (V7SharedService│              │ (Flow Logic)    │
│  .Validation)   │              │                 │
└────────┬────────┘              └────────┬────────┘
         │                                │
         │ Valid?                         │
         │                                │
         ├─── No ──► Show Errors          │
         │                                │
         └─── Yes ──────────────────────► │
                                          │
                                          ▼
                                ┌─────────────────┐
                                │ API Call        │
                                │ (OAuth/OIDC)    │
                                └────────┬────────┘
                                         │
                                         ├─── Success
                                         │    │
                                         │    ▼
                                         │ ┌─────────────────┐
                                         │ │ Process Response│
                                         │ │ • Validate      │
                                         │ │ • Store tokens  │
                                         │ │ • Update UI     │
                                         │ └─────────────────┘
                                         │
                                         └─── Error
                                              │
                                              ▼
                                         ┌─────────────────┐
                                         │ Error Handling  │
                                         │ (V7SharedService│
                                         │  .ErrorHandling)│
                                         └─────────────────┘
```

---

*V7 Flow Diagrams v7.0.0 - November 2025*
