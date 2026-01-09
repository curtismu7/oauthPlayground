# Unified Flow - SPIFFE/SPIRE Flow UI Contract

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** SPIFFE/SPIRE Mock Flow (Workload Identity to PingOne Token Exchange)  
**Component:** `SpiffeSpireFlowV8U`

## Overview

The SPIFFE/SPIRE Flow is an educational mock flow that demonstrates workload identity (SVID) generation and exchange for PingOne OAuth/OIDC tokens. This flow shows how SPIFFE (Secure Production Identity Framework for Everyone) and SPIRE (SPIFFE Runtime Environment) can be integrated with PingOne for workload authentication.

### Available Spec Versions

- ✅ **OAuth 2.0**: Supported (Token Exchange - RFC 8693)
- ✅ **OAuth 2.1**: Supported (Token Exchange)
- ✅ **OIDC**: Supported (ID tokens issued)

## Flow Steps

The SPIFFE/SPIRE Flow consists of **4 steps** (1-indexed):

1. **Step 1**: Workload Attestation
2. **Step 2**: SVID Issuance
3. **Step 3**: SVID Validation
4. **Step 4**: Token Exchange

## Step-by-Step Contract

### Step 1: Workload Attestation

**Component:** `SpiffeSpireFlowV8U` (Step 1 render)  
**Purpose:** Configure workload identity attributes for SVID generation

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `trustDomain` | `string` | SPIFFE trust domain | Required, non-empty |
| `workloadPath` | `string` | Workload path within trust domain | Required, non-empty |
| `workloadType` | `'kubernetes' \| 'vm' \| 'container'` | Platform type | Required, must be one of the options |
| `environmentId` | `string` | PingOne Environment ID | Required, non-empty (UUID format) |

#### Optional Fields

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `namespace` | `string` | Kubernetes namespace | `'default'` | Only shown for Kubernetes workload type |
| `serviceAccount` | `string` | Kubernetes service account | `''` | Only shown for Kubernetes workload type |

#### Field Visibility Rules

- **Trust Domain**: Always visible
- **Workload Path**: Always visible
- **Workload Type**: Dropdown selector (kubernetes, vm, container)
- **Namespace**: Visible only when `workloadType === 'kubernetes'`
- **Service Account**: Visible only when `workloadType === 'kubernetes'`
- **Environment ID**: Always visible (loaded from global storage)

#### Default Values

```typescript
{
  trustDomain: 'example.org',
  workloadPath: 'frontend/api',
  workloadType: 'kubernetes',
  namespace: 'default',
  serviceAccount: 'frontend-sa',
  environmentId: '' // Loaded from EnvironmentIdServiceV8
}
```

#### Validation Rules

```typescript
const isValid = 
  workloadConfig.trustDomain?.trim() &&
  workloadConfig.workloadPath?.trim() &&
  workloadConfig.workloadType &&
  environmentId?.trim();
```

#### Output

- **State**: Updated `workloadConfig` object
- **Persistence**: Environment ID saved to global storage (via `EnvironmentIdServiceV8`)
- **Next Step**: Enabled when all required fields are present

#### API Call Tracking

When "Generate SVID" is clicked:
- **Mock API Call**: `POST https://spire-server.{trustDomain}:8081/spire.api.server.agent.v1.Agent/AttestAgent`
- **Tracked via**: `apiCallTrackerService.trackApiCall()` with step `'spiffe-spire-attest-agent'`
- **Response**: Mock SVID data

---

### Step 2: SVID Issuance

**Component:** `SpiffeSpireFlowV8U` (Step 2 render)  
**Purpose:** Display the issued SVID (SPIFFE Verifiable Identity Document)

#### Inputs

- `svid`: SVID object from Step 1
- `workloadConfig`: Configuration from Step 1

#### SVID Structure

```typescript
interface SVID {
  spiffeId: string;           // e.g., "spiffe://example.org/frontend/api"
  x509Certificate: string;    // X.509 certificate (PEM format)
  privateKey: string;         // Private key (PEM format)
  expiresAt: string;          // ISO 8601 expiration timestamp
  trustBundle: string;        // Trust bundle certificate (PEM format)
}
```

#### Display Fields

| Field | Display | Copy | Notes |
|-------|---------|------|-------|
| SPIFFE ID | ✅ | ✅ | Full SPIFFE ID URI |
| X.509 Certificate | ✅ | ✅ | PEM-encoded certificate |
| Private Key | ✅ | ✅ | PEM-encoded private key (⚠️ sensitive) |
| Expiration | ✅ | N/A | ISO 8601 timestamp |
| Trust Bundle | ✅ | ✅ | PEM-encoded trust bundle |

#### Educational Content

- Explains what an SVID is
- Shows SPIFFE ID format
- Explains certificate structure
- Describes trust bundle purpose

#### Next Step

- Enabled when SVID is displayed
- Proceeds to Step 3 (SVID Validation)

---

### Step 3: SVID Validation

**Component:** `SpiffeSpireFlowV8U` (Step 3 render)  
**Purpose:** Validate the SVID against the trust bundle

#### Inputs

- `svid`: SVID object from Step 2
- `workloadConfig`: Configuration from Step 1

#### Validation Process

1. **Signature Validation**: Verify certificate signature against trust bundle
2. **Expiration Check**: Ensure certificate has not expired
3. **SPIFFE ID Match**: Verify SPIFFE ID matches certificate subject
4. **Chain Validation**: Validate certificate chain

#### API Call Tracking

When "Validate SVID" is clicked:
- **Mock API Call**: `POST https://token-exchange.{trustDomain}/api/v1/validate-svid`
- **Tracked via**: `apiCallTrackerService.trackApiCall()` with step `'spiffe-spire-validate-svid'`
- **Response**: Validation results

#### Validation Response

```typescript
{
  valid: boolean;
  spiffe_id: string;
  expires_at: string;
  trust_domain: string;
  validation_checks: {
    signature_valid: boolean;
    not_expired: boolean;
    spiffe_id_matches: boolean;
    chain_valid: boolean;
  };
}
```

#### Display

- Validation status (success/error)
- Validation check results
- SPIFFE ID confirmation
- Expiration information

#### Next Step

- Enabled when validation succeeds
- Proceeds to Step 4 (Token Exchange)

---

### Step 4: Token Exchange

**Component:** `SpiffeSpireFlowV8U` (Step 4 render) or `SpiffeSpireTokenDisplayV8U`  
**Purpose:** Exchange validated SVID for PingOne OAuth/OIDC tokens

#### Inputs

- `svid`: Validated SVID from Step 3
- `environmentId`: PingOne Environment ID from Step 1

#### Token Exchange Process

1. **Token Exchange Request**: POST to PingOne token endpoint
2. **SVID Authentication**: SVID used as subject token
3. **Token Issuance**: PingOne issues access token and ID token
4. **Token Display**: Tokens displayed with decode/copy options

#### API Call Tracking

When "Exchange for PingOne Token" is clicked:
- **Mock API Call**: `POST https://auth.pingone.com/{environmentId}/as/token`
- **Tracked via**: `apiCallTrackerService.trackApiCall()` with step `'spiffe-spire-token-exchange'`
- **Request Body**:
  ```json
  {
    "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
    "subject_token": "{x509Certificate}",
    "subject_token_type": "urn:ietf:params:oauth:token-type:spiffe-svid",
    "scope": "openid profile email",
    "requested_token_type": "urn:ietf:params:oauth:token-type:access_token"
  }
  ```

#### Token Response

```typescript
interface PingOneToken {
  accessToken: string;      // JWT access token
  tokenType: 'Bearer';
  expiresIn: number;        // 3600 seconds
  scope: string;            // "openid profile email"
  idToken?: string;         // JWT ID token (OIDC)
}
```

#### Display Fields

| Token | Display | Decode | Copy | Notes |
|-------|---------|--------|------|-------|
| Access Token | ✅ | ✅ (JWT) | ✅ | Always present |
| ID Token | ✅ | ✅ (JWT) | ✅ | OIDC token with workload identity |
| Refresh Token | ❌ | N/A | N/A | Not issued in token exchange |

#### Token Claims

**Access Token Claims**:
- `sub`: SPIFFE ID (workload identity)
- `iss`: PingOne issuer
- `aud`: PingOne audience
- `exp`: Expiration timestamp
- `scope`: Granted scopes
- `spiffe_id`: SPIFFE ID (custom claim)
- `workload_identity`: `true` (custom claim)

**ID Token Claims**:
- `sub`: SPIFFE ID
- `iss`: PingOne issuer
- `aud`: Client ID
- `name`: Workload name (derived from SPIFFE ID)
- `spiffe_id`: SPIFFE ID (custom claim)
- `workload_type`: `'service'` (custom claim)

#### Educational Content

- Explains OAuth 2.0 Token Exchange (RFC 8693)
- Shows how SPIFFE ID maps to PingOne service account
- Describes workload identity concepts
- Provides next steps for using tokens

#### Next Steps

- Tokens can be used to access PingOne-protected APIs
- ID token can be used for workload authentication
- Access token can be used for API authorization

---

## State Management

### Flow State Interface

```typescript
interface SpiffeSpireFlowState {
  currentStep: 1 | 2 | 3 | 4;
  workloadConfig: {
    trustDomain: string;
    workloadPath: string;
    workloadType: 'kubernetes' | 'vm' | 'container';
    namespace?: string;
    serviceAccount?: string;
  };
  environmentId: string;
  svid: SVID | null;
  pingOneToken: PingOneToken | null;
}
```

### Persistence

#### Environment ID Storage

- **Location**: `localStorage` (via `EnvironmentIdServiceV8`)
- **Key**: Global environment ID key
- **Storage Trigger**: On environment ID change
- **Restoration**: Auto-restored on component mount

#### Workload Configuration Storage

- **Location**: Component state (NOT persisted)
- **Reason**: Educational flow, configuration is temporary
- **Lifespan**: Lost on page refresh or navigation away

#### SVID Storage

- **Location**: Component state (NOT persisted)
- **Reason**: Security - SVIDs contain private keys
- **Lifespan**: Lost on page refresh or navigation away

#### Token Storage

- **Location**: Navigation state (passed via React Router)
- **Route**: `/v8u/spiffe-spire/tokens`
- **State**: Tokens passed in navigation state
- **Lifespan**: Lost on page refresh (not persisted)

---

## URL Parameters

### Routes

```
/v8u/spiffe-spire/attest    # Step 1: Workload Attestation
/v8u/spiffe-spire/svid      # Step 2: SVID Issuance
/v8u/spiffe-spire/validate  # Step 3: SVID Validation
/v8u/spiffe-spire/tokens    # Step 4: Token Exchange
```

### Route Navigation

- Step 1 → Step 2: Navigate to `/v8u/spiffe-spire/svid`
- Step 2 → Step 3: Navigate to `/v8u/spiffe-spire/validate`
- Step 3 → Step 4: Navigate to `/v8u/spiffe-spire/tokens` (with tokens in state)
- Reset: Navigate to `/v8u/spiffe-spire/attest`

---

## Error Handling

### Configuration Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing Trust Domain | Required field empty | Enter trust domain |
| Missing Workload Path | Required field empty | Enter workload path |
| Missing Environment ID | Required field empty | Enter Environment ID or load from global storage |

### SVID Generation Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid Workload Config | Configuration invalid | Check all required fields |
| SPIRE Server Error | Mock server error | Retry or check configuration |

### Validation Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid Signature | Certificate signature invalid | Regenerate SVID |
| Certificate Expired | SVID has expired | Regenerate SVID |
| SPIFFE ID Mismatch | ID doesn't match certificate | Check workload configuration |

### Token Exchange Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid SVID | SVID validation failed | Re-validate SVID |
| Token Exchange Failed | PingOne token exchange error | Check environment ID and SVID |
| Missing Environment ID | Environment ID not set | Set environment ID |

---

## Compliance Rules

### OAuth 2.0 Token Exchange (RFC 8693)

- ✅ Token Exchange grant type supported
- ✅ Subject token type: `urn:ietf:params:oauth:token-type:spiffe-svid`
- ✅ Requested token type: `urn:ietf:params:oauth:token-type:access_token`
- ✅ Access tokens issued
- ✅ ID tokens issued (OIDC)

### SPIFFE/SPIRE Standards

- ✅ SPIFFE ID format: `spiffe://{trustDomain}/{workloadPath}`
- ✅ X.509 SVID format (PEM-encoded)
- ✅ Trust bundle validation
- ✅ Certificate chain validation

### OIDC

- ✅ ID tokens issued with workload identity
- ✅ Custom claims: `spiffe_id`, `workload_identity`, `workload_type`
- ✅ Subject claim contains SPIFFE ID

---

## API Endpoints Used

### Mock SPIRE Endpoints

1. **SPIRE Agent Attestation**:
   ```
   POST https://spire-server.{trustDomain}:8081/spire.api.server.agent.v1.Agent/AttestAgent
   ```

2. **Token Exchange Service - SVID Validation**:
   ```
   POST https://token-exchange.{trustDomain}/api/v1/validate-svid
   ```

### PingOne Endpoints

1. **Token Exchange Endpoint**:
   ```
   POST https://auth.pingone.com/{environmentId}/as/token
   ```

### Backend Proxy Endpoints

- **Note**: This is a mock flow - no backend proxy is used
- All API calls are simulated in the frontend
- Real implementation would use backend proxy for PingOne token exchange

---

## Testing Checklist

### Step 1: Workload Attestation

- [ ] Trust Domain field accepts valid string
- [ ] Workload Path field accepts valid string
- [ ] Workload Type selector shows all options
- [ ] Namespace field shown only for Kubernetes
- [ ] Service Account field shown only for Kubernetes
- [ ] Environment ID loaded from global storage
- [ ] Form validation shows errors for missing fields
- [ ] "Generate SVID" button enabled when valid

### Step 2: SVID Issuance

- [ ] SVID displayed after generation
- [ ] SPIFFE ID displayed correctly
- [ ] X.509 certificate displayed (PEM format)
- [ ] Private key displayed (PEM format)
- [ ] Trust bundle displayed
- [ ] Expiration timestamp shown
- [ ] Copy buttons work for all fields
- [ ] "Validate SVID" button enabled

### Step 3: SVID Validation

- [ ] Validation request sent when button clicked
- [ ] Validation results displayed
- [ ] All validation checks shown
- [ ] Success/error status displayed
- [ ] "Exchange for PingOne Token" button enabled on success

### Step 4: Token Exchange

- [ ] Token exchange request sent
- [ ] Access token received and displayed
- [ ] ID token received and displayed
- [ ] Token decode works (JWT)
- [ ] Token copy works
- [ ] Token claims displayed correctly
- [ ] SPIFFE ID present in token claims

---

## Implementation Notes

### Key Characteristics

1. **Educational Mock Flow**: Demonstrates concepts, not production implementation
2. **No Persistence**: Configuration and SVIDs not persisted (security)
3. **Mock API Calls**: All SPIRE calls are simulated
4. **Real Token Exchange**: PingOne token exchange uses real format (mock implementation)
5. **Workload Identity**: Tokens contain SPIFFE ID as workload identity

### Security Considerations

1. **Private Keys**: Never persisted, only in component state
2. **SVID Security**: SVIDs contain sensitive data, not stored
3. **Token Security**: Tokens passed via navigation state (not persisted)
4. **Environment ID**: Loaded from global storage (shared with other flows)

### Best Practices

1. ✅ Use real SPIRE agents and servers in production
2. ✅ Implement proper SVID rotation
3. ✅ Secure token exchange service
4. ✅ Validate SVIDs before token exchange
5. ✅ Use appropriate scopes for workload identity

---

## Step 4: API Documentation

**Component:** `UnifiedFlowDocumentationPageV8U` (if implemented)  
**Purpose:** Display comprehensive API documentation for the flow

### Download Options

If the documentation page is implemented, it provides three download options:

1. **Download Markdown** (`handleDownloadMarkdown`)
   - Icon: `FiFileText`
   - Background: `#3b82f6` (blue)
   - Generates markdown file with all API calls

2. **Download PDF** (`handleDownloadPDF`)
   - Icon: `FiDownload`
   - Background: `#10b981` (green)
   - Generates PDF file with all API calls

3. **Download Postman Collection** (`handleDownloadPostman`)
   - Icon: `FiPackage`
   - Background: `#8b5cf6` (purple)
   - Generates Postman collection JSON file
   - Format: `{{authPath}}/{{envID}}/path` (matches PingOne documentation format)
   - Variables included: `authPath`, `envID`, `workerToken`
   - Reference: [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)

### Postman Collection Format

The generated Postman collection uses the following format:
- **URL Format**: `{{authPath}}/{{envID}}/as/token` (for token exchange)
- **Variables**:
  - `authPath`: `https://auth.pingone.com` (includes protocol)
  - `envID`: Environment ID from credentials
  - `workerToken`: Empty (user fills in)

### Button Styling

All download buttons:
- Padding: `12px 24px`
- Border radius: `8px`
- Font size: `16px`
- Font weight: `600`
- Display: `flex`
- Align items: `center`
- Gap: `8px`

---

## References

- [SPIFFE Specification](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/)
- [SPIRE Documentation](https://spiffe.io/docs/latest/spire-about/)
- [RFC 8693 - OAuth 2.0 Token Exchange](https://tools.ietf.org/html/rfc8693)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/main/v1/api/)
- [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)
- [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)
