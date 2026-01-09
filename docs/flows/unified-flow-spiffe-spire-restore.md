# Unified Flow - SPIFFE/SPIRE Flow Restore & Persistence Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** SPIFFE/SPIRE Mock Flow (Workload Identity to PingOne Token Exchange)  
**Component:** `SpiffeSpireFlowV8U`

## Table of Contents

1. [Overview](#overview)
2. [Storage Locations](#storage-locations)
3. [State Persistence](#state-persistence)
4. [State Restoration](#state-restoration)
5. [URL Parameter Handling](#url-parameter-handling)
6. [Reset Semantics](#reset-semantics)
7. [Session Management](#session-management)
8. [Data Flow](#data-flow)

---

## Overview

The SPIFFE/SPIRE Flow uses minimal persistence due to its educational nature and security considerations. This document details what is stored where, when, and how it's restored.

### Postman Collection Downloads

### Overview

If the documentation page is implemented, it provides a **Postman Collection** download feature that generates a complete Postman collection JSON file with all API calls from the flow.

### Collection Format

The generated Postman collection follows the [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template) format:

- **URL Format**: `{{authPath}}/{{envID}}/as/token` (for token exchange)
- **Variables**: Pre-configured with values from credentials
- **Headers**: Automatically set (Content-Type, Authorization)
- **Request Bodies**: Pre-filled with example data

### Variables Included

| Variable | Value | Type | Source |
|----------|-------|------|--------|
| `authPath` | `https://auth.pingone.com` | `string` | Default (includes protocol) |
| `envID` | Environment ID | `string` | From credentials |
| `workerToken` | Empty | `string` | User fills in |

### Storage

**Postman collections are NOT persisted** - they are generated on-demand when the user clicks "Download Postman Collection".

### Generation Process

1. **Source**: API calls tracked during flow execution via `apiCallTrackerService`
2. **Conversion**: Endpoints converted to Postman format: `{{authPath}}/{{envID}}/path`
3. **Variables**: Extracted from current credentials
4. **Collection Generation**: Postman collection JSON file created with all API requests
5. **Environment Generation**: Postman environment JSON file created with all variables pre-filled
6. **Download**: Both files downloaded:
    -   Collection: `pingone-{flowType}-{specVersion}-{date}-collection.json`
    -   Environment: `pingone-{flowType}-{specVersion}-{date}-environment.json`

### Environment Variables

The generated environment file includes all variables with pre-filled values from credentials:

-   `authPath`: `https://auth.pingone.com` (default, includes protocol)
-   `envID`: Pre-filled from `environmentId` in credentials
-   `workerToken`: Empty (user fills in)
-   `spiffe_id`: Empty (generated per workload)
-   `svid`: Empty (generated per workload)
-   `access_token`: Empty (filled after token exchange)

### Usage

1. User completes flow and reaches documentation page (if implemented)
2. User clicks "Download Postman Collection" button
3. Two JSON files are generated and downloaded:
    -   Collection file with all API requests
    -   Environment file with all variables
4. User imports both files into Postman:
    -   Import collection file → All API requests available
    -   Import environment file → All variables pre-configured
5. User selects the imported environment from Postman's environment dropdown
6. User updates environment variables with actual values if needed
7. User can test API calls directly in Postman (variables automatically substituted)

**Reference**: [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)

---

## Storage Strategy

The SPIFFE/SPIRE Flow uses a **minimal persistence strategy**:

1. **Environment ID**: `localStorage` (via `EnvironmentIdServiceV8`) - persists across sessions
2. **Workload Configuration**: Component state (NOT persisted) - lost on refresh
3. **SVID**: Component state (NOT persisted) - lost on refresh (security)
4. **Tokens**: Navigation state (NOT persisted) - lost on refresh
5. **URL State**: Route parameters (ephemeral)

### Key Principles

- ✅ **Environment ID persists** across browser sessions (localStorage)
- ❌ **Workload configuration NOT persisted** (educational flow, temporary)
- ❌ **SVID NOT persisted** (security - contains private keys)
- ❌ **Tokens NOT persisted** (passed via navigation state only)
- ✅ **URL state** is used for navigation and step restoration

---

## Storage Locations

### 1. Environment ID Storage (`localStorage`)

**Purpose**: Persist PingOne Environment ID across browser sessions.

**Storage Key**: Global environment ID key (via `EnvironmentIdServiceV8`)

**Stored Data Structure**:
```typescript
{
  environmentId: string;  // UUID format
}
```

**Storage Triggers**:
- On environment ID change
- When environment ID is manually set
- When loaded from other flows

**Retrieval**:
- On component mount
- When flow initializes
- When environment ID is needed

**Lifespan**: Persists until:
- User manually clears browser data
- User explicitly clears environment ID
- Application uninstalls

**Note**: Environment ID is shared with other flows (MFA, Unified flows, etc.)

---

### 2. Workload Configuration (Component State - NOT Persisted)

**Purpose**: Temporary storage for workload configuration during flow execution.

**Storage Location**: React component state (in-memory)

**Stored Data Structure**:
```typescript
{
  trustDomain: string;
  workloadPath: string;
  workloadType: 'kubernetes' | 'vm' | 'container';
  namespace?: string;        // Only for Kubernetes
  serviceAccount?: string;   // Only for Kubernetes
}
```

**Storage Triggers**:
- On field change (immediate state update)
- When form is filled

**Retrieval**:
- From component state (not from storage)
- Lost on page refresh or navigation away

**Lifespan**: Persists only during:
- Current component mount
- Page session (until refresh)
- Navigation within flow steps

**Why Not Persisted**:
- Educational flow - configuration is temporary
- No need to restore between sessions
- Simplifies flow (no storage complexity)

---

### 3. SVID Storage (Component State - NOT Persisted)

**Purpose**: Temporary storage for SVID during flow execution.

**Storage Location**: React component state (in-memory)

**Stored Data Structure**:
```typescript
{
  spiffeId: string;           // e.g., "spiffe://example.org/frontend/api"
  x509Certificate: string;    // PEM-encoded certificate
  privateKey: string;         // PEM-encoded private key (⚠️ sensitive)
  expiresAt: string;          // ISO 8601 timestamp
  trustBundle: string;        // PEM-encoded trust bundle
}
```

**Storage Triggers**:
- After SVID generation (Step 1 → Step 2)
- When SVID is created

**Retrieval**:
- From component state (not from storage)
- Lost on page refresh or navigation away

**Lifespan**: Persists only during:
- Current component mount
- Page session (until refresh)
- Navigation within flow steps

**Why Not Persisted**:
- **Security**: SVIDs contain private keys - should not be stored
- **Educational**: Mock flow - no need for persistence
- **Best Practice**: Private keys should never be persisted in browser storage

---

### 4. Token Storage (Navigation State - NOT Persisted)

**Purpose**: Pass tokens to token display page.

**Storage Location**: React Router navigation state (ephemeral)

**Stored Data Structure**:
```typescript
{
  tokens: {
    accessToken: string;
    idToken?: string;
    expiresIn: number;
  }
}
```

**Storage Triggers**:
- After token exchange (Step 3 → Step 4)
- When navigating to token display page

**Retrieval**:
- From navigation state (via `useLocation().state`)
- Lost on page refresh or navigation away

**Lifespan**: Persists only during:
- Navigation to token display page
- Current page session (until refresh)

**Why Not Persisted**:
- **Security**: Tokens should not be persisted in browser storage
- **Educational**: Mock flow - tokens are temporary
- **Best Practice**: Tokens should be stored securely (not in localStorage/sessionStorage)

---

### 5. URL State (Route Parameters)

**Purpose**: Enable navigation and step restoration.

**Route Format**:
```
/v8u/spiffe-spire/{step}
```

**Step Values**:
- `attest` = Step 1 (Workload Attestation)
- `svid` = Step 2 (SVID Issuance)
- `validate` = Step 3 (SVID Validation)
- `tokens` = Step 4 (Token Exchange)

**Examples**:
- `/v8u/spiffe-spire/attest` - Step 1
- `/v8u/spiffe-spire/svid` - Step 2
- `/v8u/spiffe-spire/validate` - Step 3
- `/v8u/spiffe-spire/tokens` - Step 4

**URL State Restoration**:
- **Step Detection**: Route path determines current step
- **Navigation**: Route updates when moving between steps

**Navigation**:
- Step navigation updates URL route
- Browser back/forward works with URL state
- Deep links work (e.g., bookmark to specific step)

---

## State Persistence

### Saving Environment ID

**Trigger**: User sets environment ID or it's loaded from global storage.

**Process**:
1. Environment ID is set in component state
2. Saved to global storage via `EnvironmentIdServiceV8.saveEnvironmentId()`
3. Stored in `localStorage` under global environment ID key

**Save Conditions**:
- ✅ Environment ID is valid (non-empty, UUID format)
- ✅ Environment ID is different from stored value

### Loading Environment ID

**Trigger**: Component mount, flow initialization.

**Process**:
1. Check global storage via `EnvironmentIdServiceV8.getEnvironmentId()`
2. If found, load into component state
3. If not found, use default or prompt user

**Load Priority**:
1. **Global Storage** (localStorage via `EnvironmentIdServiceV8`)
2. **Default Value** (if no stored value, use example: `b9817c16-9910-4415-b67e-4ac687da74d9`)

**Default Behavior**:
- If no environment ID is stored, flow auto-fills with default example
- User can change it at any time
- Changed value is saved to global storage

---

## State Restoration

### Initial Load Restoration

**Scenario**: User navigates to `/v8u/spiffe-spire/{step}` or refreshes page.

**Restoration Process**:

1. **Route Detection**:
   - Parse URL route: `/v8u/spiffe-spire/{step}`
   - Extract step name from route
   - Determine current step number

2. **Environment ID Restoration**:
   - Load environment ID from global storage
   - Key: Global environment ID key (via `EnvironmentIdServiceV8`)
   - Populate environment ID field

3. **Step Restoration**:
   - Navigate to step from URL route
   - Render appropriate step component
   - Show step indicator

**Restoration Limitations**:
- ❌ **Workload Configuration**: NOT restored (must re-enter)
- ❌ **SVID**: NOT restored (must regenerate)
- ❌ **Tokens**: NOT restored (must re-exchange)

**Why Limited Restoration**:
- Educational flow - no need for full persistence
- Security - SVIDs and tokens should not be persisted
- Simplicity - reduces complexity

### Session Restoration

**Scenario**: User refreshes page or navigates back during flow.

**Restoration Priority**:

1. **Environment ID**:
   - Always restored from global storage
   - Available across all flows

2. **Current Step**:
   - Restored from URL route
   - Step indicator shows current step

3. **Workload Configuration**:
   - ❌ NOT restored (must re-enter)
   - User must fill form again

4. **SVID**:
   - ❌ NOT restored (must regenerate)
   - User must click "Generate SVID" again

5. **Tokens**:
   - ❌ NOT restored (must re-exchange)
   - User must complete token exchange again

**Restoration Failures**:
- **Missing Environment ID**: Show default or prompt user
- **Invalid Step**: Redirect to Step 1 (attest)
- **Missing SVID**: User must regenerate
- **Missing Tokens**: User must re-exchange

---

## URL Parameter Handling

### Route Parameters

**Route Structure**:
```
/v8u/spiffe-spire/{step}
```

**Step Values**: `attest`, `svid`, `validate`, `tokens`

**Route Parameter Extraction**:
```typescript
// React Router
const { step } = useParams<{
  step: string;
}>();

// Map step name to step number
const stepMap: Record<string, number> = {
  'attest': 1,
  'svid': 2,
  'validate': 3,
  'tokens': 4
};

const currentStep = stepMap[step || 'attest'] || 1;
```

**Route Updates**:
- Step navigation updates route parameter
- URL changes when user completes a step
- Browser back/forward updates route

### Query Parameters

**Supported Parameters**: None

**Note**: This flow does not use query parameters. All state is in route or component state.

---

## Reset Semantics

### Reset Flow Action

**Trigger**: User clicks "Reset Flow" button or starts new flow.

**What Gets Reset**:
- ✅ **Component State**: All React state cleared
- ✅ **Current Step**: Reset to Step 1
- ✅ **URL State**: Reset to `/v8u/spiffe-spire/attest`
- ❌ **Environment ID**: **NOT cleared** (preserved in global storage)

**Reset Process**:
```typescript
// Clear component state
setCurrentStep(1);
setWorkloadConfig(defaultConfig);
setSvid(null);
setPingOneToken(null);

// Navigate to Step 1
navigate('/v8u/spiffe-spire/attest');
```

### Clear Environment ID Action

**Trigger**: User explicitly clears environment ID (if action available).

**What Gets Cleared**:
- ✅ **Global Environment ID**: Removed from localStorage
- ✅ **Component State**: Environment ID cleared from state

**Clear Process**:
```typescript
// Clear global storage
EnvironmentIdServiceV8.clearEnvironmentId();

// Clear component state
setEnvironmentId('');
```

### Partial Reset

**Scenario**: User wants to retry a specific step.

**What Gets Preserved**:
- ✅ **Environment ID**: Preserved in global storage
- ✅ **Workload Configuration**: Preserved in component state (until refresh)

**What Gets Reset**:
- ✅ **Current Step State**: Cleared
- ✅ **SVID** (if regenerating): Cleared
- ✅ **Tokens** (if re-exchanging): Cleared
- ✅ **Error Messages**: Cleared
- ✅ **Loading State**: Reset

---

## Session Management

### Browser Session

**Session Boundaries**:
- **Start**: Browser tab/window opened
- **End**: Browser tab/window closed
- **Scope**: Per-tab (not shared across tabs)

**Component State Behavior**:
- ✅ Persists during tab lifetime
- ✅ Shared across same-tab navigations
- ❌ Lost on page refresh
- ❌ Lost on tab close
- ❌ Not shared across tabs

### Cross-Tab Behavior

**Isolation**:
- Each tab has its own component state
- Workload configuration in Tab A is not visible in Tab B
- Environment ID (localStorage) is shared across tabs

**Shared State**:
- ✅ **Environment ID**: Shared via localStorage
- ❌ **Workload Configuration**: Isolated per tab
- ❌ **SVID**: Isolated per tab
- ❌ **Tokens**: Isolated per tab

**Conflict Resolution**:
- If user opens multiple tabs:
  - Each tab has independent flow state
  - Environment ID is shared (last save wins)
  - Workload configuration is independent per tab

### Session Expiration

**Component State Expiration**:
- Component state is lost on:
  - Page refresh
  - Tab close
  - Navigation away from flow

**Environment ID Expiration**:
- Environment ID persists until:
  - User manually clears browser data
  - User explicitly clears environment ID
  - Application uninstalls

**Token Expiration**:
- Tokens expire after 1 hour (3600 seconds)
- Tokens are not persisted, so expiration is handled by re-exchanging SVID

---

## Data Flow

### Complete Flow Sequence

```
1. User Configures Workload (Step 1)
   ↓
   [Component State] workloadConfig
   [Global Storage] environmentId (if changed)
   
2. Generate SVID (Step 1 → Step 2)
   ↓
   [Component State] svid
   [Navigation] /v8u/spiffe-spire/svid
   
3. Validate SVID (Step 2 → Step 3)
   ↓
   [Component State] svid (validated)
   [Navigation] /v8u/spiffe-spire/validate
   
4. Exchange for Tokens (Step 3 → Step 4)
   ↓
   [Component State] pingOneToken
   [Navigation State] tokens (passed to token display)
   [Navigation] /v8u/spiffe-spire/tokens
```

### Restoration Flow

```
Page Load / Navigation
   ↓
[Route Detection] /v8u/spiffe-spire/{step}
   ↓
[Global Storage] Load environmentId
   ↓
[Restore Step] Navigate to step from route
   ↓
[Restore UI] Populate environment ID field
   ↓
[User Action] Re-enter workload config (if needed)
```

### Error Recovery Flow

```
Error Detected (e.g., invalid config, SVID expired)
   ↓
[Clear Invalid State] Reset component state
   ↓
[Show Error Message] User notification
   ↓
[Offer Recovery Options]
   - Retry current step
   - Start from Step 1
   - Reset entire flow
   ↓
[User Action] → Recovery path
```

---

## Best Practices

### For Developers

1. ✅ **Don't Persist SVIDs**: Never store SVIDs in browser storage (security)
2. ✅ **Don't Persist Tokens**: Never store tokens in localStorage/sessionStorage
3. ✅ **Use Navigation State**: Pass tokens via React Router navigation state
4. ✅ **Clear State on Reset**: Always clear component state when resetting
5. ✅ **Handle Restoration**: Support page refresh gracefully (with limitations)

### For Users

1. ✅ **Complete Flow in One Session**: Avoid refreshing page mid-flow
2. ✅ **Re-enter Configuration**: Configuration is not saved - re-enter if needed
3. ✅ **Regenerate SVID**: SVIDs are not saved - regenerate if needed
4. ✅ **Re-exchange Tokens**: Tokens are not saved - re-exchange if needed
5. ✅ **Use Environment ID**: Environment ID is saved - reuse across flows

---

## Troubleshooting

### Configuration Lost After Refresh

**Problem**: Workload configuration lost after page refresh.

**Cause**: Configuration is not persisted (by design).

**Solution**: 
- This is expected behavior
- Re-enter configuration after refresh
- Complete flow in one session if possible

### SVID Lost After Refresh

**Problem**: SVID lost after page refresh.

**Cause**: SVIDs are not persisted (security).

**Solution**:
- This is expected behavior (security best practice)
- Regenerate SVID after refresh
- Complete flow in one session if possible

### Tokens Lost After Refresh

**Problem**: Tokens lost after page refresh.

**Cause**: Tokens are not persisted (security).

**Solution**:
- This is expected behavior (security best practice)
- Re-exchange SVID for tokens after refresh
- Complete flow in one session if possible

### Environment ID Not Restored

**Problem**: Environment ID not loaded on page load.

**Causes**:
- No environment ID saved in global storage
- Browser localStorage disabled
- Browser data cleared

**Solutions**:
- Enter environment ID manually
- Check browser localStorage settings
- Verify environment ID is saved in other flows

---

## References

- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React Router - Navigation State](https://reactrouter.com/en/main/route/route)
- [SPIFFE Specification](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/)
- [RFC 8693 - OAuth 2.0 Token Exchange](https://tools.ietf.org/html/rfc8693)
