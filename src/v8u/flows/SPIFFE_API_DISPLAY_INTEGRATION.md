# SPIFFE/SPIRE Flow - API Call Display Integration

## Overview

Integrated the Enhanced API Call Display service to show users the mock API interactions happening during the SPIFFE/SPIRE to PingOne token exchange flow.

## API Calls Added

### 1. Workload Attestation (Step 1)

**Endpoint**: `POST https://spire-server.{trustDomain}:8081/spire.api.server.agent.v1.Agent/AttestAgent`

**Purpose**: SPIRE Agent attests the workload identity using platform-specific mechanisms

**Request Body**:
```json
{
  "attestation_data": {
    "type": "kubernetes",
    "data": {
      "namespace": "default",
      "service_account": "frontend-sa",
      "pod_name": "api-pod-abc123"
    }
  }
}
```

**Response**:
```json
{
  "svid": {
    "spiffe_id": "spiffe://example.org/frontend/api",
    "x509_svid": "[X.509 Certificate Data]",
    "x509_svid_key": "[Private Key Data]",
    "x509_bundle": "[Trust Bundle Data]"
  },
  "expires_at": "2024-11-17T15:30:00Z"
}
```

**Educational Notes**:
- SPIRE Agent verifies the workload using platform-specific attestation
- For Kubernetes: validates pod UID, namespace, and service account
- For VMs: validates instance metadata from cloud provider
- Attestation proves the workload is what it claims to be

**Duration**: ~1200ms

---

### 2. SVID Validation (Step 2)

**Endpoint**: `POST https://token-exchange.{trustDomain}/api/v1/validate-svid`

**Purpose**: Token Exchange Service validates the SVID against the trust bundle

**Request Body**:
```json
{
  "svid": "[X.509 Certificate]",
  "trust_bundle": "[Trust Bundle]",
  "spiffe_id": "spiffe://example.org/frontend/api"
}
```

**Response**:
```json
{
  "valid": true,
  "spiffe_id": "spiffe://example.org/frontend/api",
  "expires_at": "2024-11-17T15:30:00Z",
  "trust_domain": "example.org",
  "validation_checks": {
    "signature_valid": true,
    "not_expired": true,
    "spiffe_id_matches": true,
    "chain_valid": true
  }
}
```

**Educational Notes**:
- Validates the SVID certificate signature against the trust bundle
- Checks that the certificate has not expired
- Verifies the SPIFFE ID matches the certificate subject
- Ensures the certificate chain is valid

**Duration**: ~800ms

---

### 3. Token Exchange (Step 3)

**Endpoint**: `POST https://auth.pingone.com/{environmentId}/as/token`

**Purpose**: Exchange SPIFFE SVID for PingOne OAuth/OIDC tokens

**Request Body**:
```json
{
  "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
  "subject_token": "[X.509 Certificate]",
  "subject_token_type": "urn:ietf:params:oauth:token-type:spiffe-svid",
  "scope": "openid profile email",
  "requested_token_type": "urn:ietf:params:oauth:token-type:access_token"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

**Educational Notes**:
- Uses OAuth 2.0 Token Exchange (RFC 8693) to convert SVID to OAuth token
- Token Exchange Service maps SPIFFE ID to PingOne service account
- PingOne validates the request and issues access token and ID token
- Tokens can now be used to access PingOne-protected APIs and resources

**Duration**: ~1300ms

---

## UI Integration

### API Calls Card

Located in the right column, appears after step 1 and grows as more API calls are made.

**Features**:
- Shows total count of API calls
- Info alert explaining these are mock interactions
- Each API call is expandable with full details

### EnhancedApiCallDisplay Component

Each API call displays:
- **Method and URL**: Color-coded HTTP method badge
- **Status**: Success/error badge with status code
- **Duration**: Response time in milliseconds
- **Request Details**: Headers and body (expandable)
- **Response Details**: Status, headers, and data (expandable)
- **Educational Notes**: Bullet points explaining what's happening
- **cURL Command**: Copy-paste ready command for testing

### Display Options

```typescript
{
  includeHeaders: true,        // Show request/response headers
  includeBody: true,           // Show request/response body
  prettyPrint: true,           // Format JSON nicely
  showEducationalNotes: true,  // Show learning points
  showFlowContext: true,       // Show flow-specific context
}
```

## User Experience

### Step 1: Workload Attestation
1. User clicks "Attest Workload & Issue SVID"
2. Phase transition overlay appears
3. API call is created and added to display
4. After 1.5s, SVID appears with API call details

### Step 2: SVID Validation
1. User clicks "Validate SVID with Trust Bundle"
2. Phase transition overlay appears
3. Validation API call is added to display
4. After 1s, validation complete with API details

### Step 3: Token Exchange
1. User clicks "Exchange SVID for PingOne Token"
2. Phase transition overlay appears
3. Token exchange API call is added to display
4. After 1.5s, tokens appear with API details

### Exploring API Calls
- Users can expand each API call to see full details
- Copy cURL commands to try in their own environment
- Read educational notes to understand each step
- See realistic request/response payloads

## Educational Value

### What Users Learn

1. **SPIRE API Structure**: See how SPIRE Agent APIs work
2. **Attestation Process**: Understand platform-specific attestation data
3. **SVID Validation**: Learn what checks are performed
4. **Token Exchange**: See OAuth 2.0 Token Exchange (RFC 8693) in action
5. **Request/Response Flow**: Understand the complete API interaction
6. **Timing**: See realistic response times for each operation

### Real-World Application

Users can:
- Copy cURL commands and adapt for their environment
- Understand the API endpoints they need to implement
- See the exact request/response formats
- Learn the OAuth grant type for SPIFFE token exchange
- Understand validation requirements

## Technical Implementation

### State Management

```typescript
const [apiCalls, setApiCalls] = useState<EnhancedApiCallData[]>([]);
```

### Adding API Calls

```typescript
// Create API call object
const apiCall: EnhancedApiCallData = {
  method: 'POST',
  url: 'https://...',
  headers: { ... },
  body: { ... },
  description: '...',
  educationalNotes: [...],
  timestamp: new Date(),
};

// Add response after "processing"
apiCall.response = {
  status: 200,
  statusText: 'OK',
  data: { ... }
};
apiCall.duration = 1200;

// Add to state
setApiCalls(prev => [...prev, apiCall]);
```

### Display Component

```typescript
<EnhancedApiCallDisplay
  apiCall={apiCall}
  options={{
    includeHeaders: true,
    includeBody: true,
    prettyPrint: true,
    showEducationalNotes: true,
    showFlowContext: true,
  }}
/>
```

## Mock vs Real

### Mock (Current Implementation)
- Simulated API calls with realistic data
- Hardcoded responses
- Controlled timing
- Educational focus

### Real (Production)
- Actual SPIRE server and agent
- Real PingOne token endpoint
- Variable response times
- Production-ready error handling

## Benefits

1. **Transparency**: Users see exactly what's happening
2. **Education**: Learn the API structure and flow
3. **Debugging**: Understand where issues might occur
4. **Implementation**: Copy cURL commands for testing
5. **Trust**: See the complete request/response cycle

## Files Modified

1. **src/v8u/flows/SpiffeSpireFlowV8U.tsx**
   - Added `EnhancedApiCallDisplay` import
   - Added `apiCalls` state
   - Created mock API calls in each step handler
   - Added API calls display card in UI

## Dependencies

- `@/components/EnhancedApiCallDisplay` - Display component
- `@/services/enhancedApiCallDisplayService` - Service types

## Future Enhancements

Potential improvements:
- Export API calls to Postman collection
- Add "Try in Postman" button
- Show network waterfall diagram
- Add request/response size information
- Include retry logic visualization
- Show rate limiting information

---

**Impact**: Users can now see and understand the complete API interaction flow, making the mock educational and practical.
