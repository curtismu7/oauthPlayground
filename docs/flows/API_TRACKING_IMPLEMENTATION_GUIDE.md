# API Call Tracking Implementation Guide

**Version:** 1.0  
**Date:** 2026-01-18  
**Purpose:** Step-by-step guide to complete API call tracking for all unified flows

## Overview

This guide provides exact file locations and code snippets to add API call tracking for all remaining flows. Follow the pattern established by the implicit flow (already complete).

---

## Implementation Pattern (Reference)

Based on the implicit flow implementation:

```typescript
// Start timing
const startTime = Date.now();
const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

// Track the API call
const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
const apiCallId = apiCallTrackerService.trackApiCall({
  method: 'GET',  // or 'POST'
  url: authorizationEndpoint,
  actualPingOneUrl: authorizationEndpoint,
  isProxy: false,
  headers: {},
  body: Object.fromEntries(params.entries()),  // Request parameters
  step: 'unified-authorization-url',  // Descriptive step name
  flowType: 'unified',
});

// ... existing code that generates the URL ...

// Update with response
apiCallTrackerService.updateApiCallResponse(
  apiCallId,
  {
    status: 200,
    statusText: 'OK',
    data: {
      authorization_url: authorizationUrl,
      note: 'Authorization URL generated. User will be redirected to PingOne.',
      flow: flowType,
    },
  },
  Date.now() - startTime
);
```

---

## 1. Authorization Code Flow

### 1.1 Authorization URL Generation

**File:** `src/v8u/services/unifiedFlowIntegrationV8U.ts`  
**Location:** Around line 585-595 (just before `return` statement for oauth-authz flow)  
**Current Code:**
```typescript
const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

console.log(`${MODULE_TAG} ✅ OAuth authz URL generated with prefixed state`, {
  prefixedState: prefixedStateRegular,
  hasPKCE: !!pkceCodes,
  responseMode: responseModeOAuth,
});

return {
  authorizationUrl,
  state: prefixedStateRegular,
  ...(pkceCodes && {
    codeVerifier: pkceCodes.codeVerifier,
    codeChallenge: pkceCodes.codeChallenge,
  }),
};
```

**Add After Line 585 (before console.log):**
```typescript
const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

// Track authorization URL generation for API documentation
const startTime = Date.now();
const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
const apiCallId = apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: authorizationEndpoint,
  actualPingOneUrl: authorizationEndpoint,
  isProxy: false,
  headers: {},
  body: Object.fromEntries(params.entries()),
  step: 'unified-authorization-url',
  flowType: 'unified',
});

apiCallTrackerService.updateApiCallResponse(
  apiCallId,
  {
    status: 200,
    statusText: 'OK',
    data: {
      authorization_url: authorizationUrl,
      note: 'Authorization URL generated. User will be redirected to PingOne for authentication.',
      flow: 'oauth-authz',
      response_type: 'code',
      has_pkce: !!pkceCodes,
      response_mode: responseModeOAuth,
    },
  },
  Date.now() - startTime
);

console.log(`${MODULE_TAG} ✅ OAuth authz URL generated with prefixed state`, {
  prefixedState: prefixedStateRegular,
  hasPKCE: !!pkceCodes,
  responseMode: responseModeOAuth,
});
```

### 1.2 Authorization Callback

**File:** `src/v8u/components/UnifiedFlowSteps.tsx`  
**Location:** In the callback handling `useEffect` for oauth-authz flow (search for "Auto-parse authorization code")  
**Approximate Line:** Around 1700-1800

**Current Pattern:**
```typescript
// Check for authorization code in URL
if (searchParams.has('code')) {
  const code = searchParams.get('code');
  // ... handle code ...
}
```

**Add Tracking:**
```typescript
// Check for authorization code in URL
if (searchParams.has('code') && flowType === 'oauth-authz') {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  // Track callback as an API call for documentation
  const callbackStartTime = Date.now();
  const callbackUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize/callback`;
  const apiCallId = apiCallTrackerService.trackApiCall({
    method: 'GET',
    url: callbackUrl,
    actualPingOneUrl: callbackUrl,
    isProxy: false,
    headers: {},
    body: {
      code: '[REDACTED - see callback details]',
      state: state || '',
      ...Object.fromEntries(searchParams.entries()),
    },
    step: 'unified-authorization-callback',
    flowType: 'unified',
  });

  apiCallTrackerService.updateApiCallResponse(
    apiCallId,
    {
      status: 200,
      statusText: 'OK',
      data: {
        note: 'PingOne redirected user back with authorization code after successful authentication',
        code: '[REDACTED - see tokens section after exchange]',
        state: state,
        flow: 'oauth-authz',
        received_in: 'Query Parameters (?code=...)',
      },
    },
    Date.now() - callbackStartTime
  );
  
  // ... rest of existing code ...
}
```

### 1.3 Token Exchange

**File:** `src/v8u/components/UnifiedFlowSteps.tsx`  
**Location:** In `renderStep3ExchangeTokens()` or wherever token exchange happens for oauth-authz
**Note:** Token exchange IS tracked for redirectless flow (line 3641), but needs to be added for regular oauth-authz flow

**Pattern to Add (in token exchange function):**
```typescript
// Before fetch call
const tokenStartTime = Date.now();
const tokenEndpoint = `/api/token-exchange`;
const actualPingOneEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;

const callId = apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: actualPingOneEndpoint,
  actualPingOneUrl: actualPingOneEndpoint,
  isProxy: true,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: {
    grant_type: 'authorization_code',
    code: '[REDACTED]',
    redirect_uri: credentials.redirectUri,
    client_id: credentials.clientId,
    client_secret: '[REDACTED]',
    code_verifier: pkceCodes ? '[REDACTED]' : undefined,
  },
  step: 'unified-token-exchange',
  flowType: 'unified',
});

// After fetch and response parsing
apiCallTrackerService.updateApiCallResponse(
  callId,
  {
    status: response.status,
    statusText: response.statusText,
    data: {
      access_token: '[REDACTED - see tokens section]',
      token_type: tokenResponse.token_type,
      expires_in: tokenResponse.expires_in,
      id_token: tokenResponse.id_token ? '[REDACTED - see tokens section]' : undefined,
      refresh_token: tokenResponse.refresh_token ? '[REDACTED - see tokens section]' : undefined,
      scope: tokenResponse.scope,
    },
  },
  Date.now() - tokenStartTime
);
```

---

## 2. Hybrid Flow

### 2.1 Authorization URL Generation

**File:** `src/v8u/services/unifiedFlowIntegrationV8U.ts`  
**Location:** Around line 700-720 (in hybrid flow section, just before return)

**Add Tracking** (same pattern as oauth-authz):
```typescript
// Track authorization URL generation for API documentation
const startTime = Date.now();
const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
const apiCallId = apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: authorizationEndpoint,
  actualPingOneUrl: authorizationEndpoint,
  isProxy: false,
  headers: {},
  body: Object.fromEntries(params.entries()),
  step: 'unified-authorization-url',
  flowType: 'unified',
});

apiCallTrackerService.updateApiCallResponse(
  apiCallId,
  {
    status: 200,
    statusText: 'OK',
    data: {
      authorization_url: authorizationUrl,
      note: 'Authorization URL generated. User will be redirected to PingOne.',
      flow: 'hybrid',
      response_type: hybridCredentials.responseType,
      has_pkce: !!pkceCodes,
      returns_in_fragment: 'id_token, access_token (if requested)',
      returns_in_query: 'code',
    },
  },
  Date.now() - startTime
);
```

### 2.2 Authorization Callback

**File:** `src/v8u/components/UnifiedFlowSteps.tsx`  
**Location:** In hybrid callback handling (searches for both query parameters AND fragment)

**Add Tracking** (check BOTH query and fragment):
```typescript
// Track callback as an API call for documentation
const callbackStartTime = Date.now();
const callbackUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize/callback`;

// Extract params from both query and fragment
const queryParams = Object.fromEntries(searchParams.entries());
const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
const allParams = {
  ...queryParams,
  ...Object.fromEntries(fragmentParams.entries()),
};

const apiCallId = apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: callbackUrl,
  actualPingOneUrl: callbackUrl,
  isProxy: false,
  headers: {},
  body: {
    code: allParams.code ? '[REDACTED]' : undefined,
    id_token: allParams.id_token ? '[REDACTED]' : undefined,
    access_token: allParams.access_token ? '[REDACTED]' : undefined,
    state: allParams.state,
    ...allParams,
  },
  step: 'unified-authorization-callback',
  flowType: 'unified',
});

apiCallTrackerService.updateApiCallResponse(
  apiCallId,
  {
    status: 200,
    statusText: 'OK',
    data: {
      note: 'PingOne redirected user back with BOTH code (query) and tokens (fragment)',
      code: allParams.code ? '[REDACTED]' : undefined,
      id_token: allParams.id_token ? '[REDACTED]' : undefined,
      access_token: allParams.access_token ? '[REDACTED]' : undefined,
      token_type: allParams.token_type,
      expires_in: allParams.expires_in,
      state: allParams.state,
      flow: 'hybrid',
      received_code_in: 'Query Parameters (?code=...)',
      received_tokens_in: 'URL Fragment (#id_token=...)',
    },
  },
  Date.now() - callbackStartTime
);
```

### 2.3 Token Exchange

**Same as oauth-authz flow** - add tracking in token exchange function for hybrid flow.

---

## 3. Device Code Flow

### 3.1 Device Authorization Request

**File:** `src/v8u/components/UnifiedFlowSteps.tsx`  
**Location:** In device code initialization (where device authorization request is made)  
**Search for:** "device_authorization" endpoint call

**Add Tracking:**
```typescript
const deviceAuthStartTime = Date.now();
const deviceAuthEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/device_authorization`;

const callId = apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: deviceAuthEndpoint,
  actualPingOneUrl: deviceAuthEndpoint,
  isProxy: false,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: {
    client_id: credentials.clientId,
    scope: credentials.scopes || 'openid profile email',
  },
  step: 'unified-device-authorization',
  flowType: 'unified',
});

// After response
apiCallTrackerService.updateApiCallResponse(
  callId,
  {
    status: response.status,
    statusText: response.statusText,
    data: {
      device_code: '[REDACTED - used for polling]',
      user_code: deviceResponse.user_code,
      verification_uri: deviceResponse.verification_uri,
      verification_uri_complete: deviceResponse.verification_uri_complete,
      expires_in: deviceResponse.expires_in,
      interval: deviceResponse.interval,
      note: 'User must visit verification URI and enter user code to authorize device',
    },
  },
  Date.now() - deviceAuthStartTime
);
```

### 3.2 Token Polling

**File:** `src/v8u/components/UnifiedFlowSteps.tsx`  
**Location:** In device code polling function  
**Note:** Consider tracking ONLY the final successful poll, not every attempt (to avoid documentation clutter)

**Add Tracking for Successful Poll:**
```typescript
// Track only successful token poll
if (tokenResponse.access_token) {
  const pollStartTime = Date.now();
  const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
  
  const callId = apiCallTrackerService.trackApiCall({
    method: 'POST',
    url: tokenEndpoint,
    actualPingOneUrl: tokenEndpoint,
    isProxy: false,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: '[REDACTED]',
      client_id: credentials.clientId,
    },
    step: 'unified-device-token-poll',
    flowType: 'unified',
  });

  apiCallTrackerService.updateApiCallResponse(
    callId,
    {
      status: 200,
      statusText: 'OK',
      data: {
        note: `Device authorized successfully. Polled ${pollCount} time(s) before success.`,
        access_token: '[REDACTED - see tokens section]',
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        id_token: tokenResponse.id_token ? '[REDACTED]' : undefined,
        refresh_token: tokenResponse.refresh_token ? '[REDACTED]' : undefined,
        scope: tokenResponse.scope,
        poll_count: pollCount,
      },
    },
    Date.now() - pollStartTime
  );
}
```

---

## 4. Client Credentials Flow

### 4.1 Token Request

**File:** `src/v8u/components/UnifiedFlowSteps.tsx`  
**Location:** In client credentials token request function  
**Search for:** "client_credentials" grant_type

**Add Tracking:**
```typescript
const tokenStartTime = Date.now();
const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;

const callId = apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: tokenEndpoint,
  actualPingOneUrl: tokenEndpoint,
  isProxy: true,  // Usually goes through backend proxy
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: {
    grant_type: 'client_credentials',
    client_id: credentials.clientId,
    client_secret: '[REDACTED]',
    scope: credentials.scopes,
  },
  step: 'unified-client-credentials-token',
  flowType: 'unified',
});

// After response
apiCallTrackerService.updateApiCallResponse(
  callId,
  {
    status: response.status,
    statusText: response.statusText,
    data: {
      access_token: '[REDACTED - see tokens section]',
      token_type: tokenResponse.token_type,
      expires_in: tokenResponse.expires_in,
      scope: tokenResponse.scope,
      note: 'Client credentials grant - no user authentication, machine-to-machine',
    },
  },
  Date.now() - tokenStartTime
);
```

### 4.2 Token Introspection (If Used)

**File:** `src/v8u/components/UnifiedFlowSteps.tsx`  
**Location:** In introspection function (if client credentials uses it)

**Add Tracking:**
```typescript
const introspectStartTime = Date.now();
const introspectEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/introspect`;

const callId = apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: introspectEndpoint,
  actualPingOneUrl: introspectEndpoint,
  isProxy: true,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: {
    token: '[REDACTED]',
    client_id: credentials.clientId,
    client_secret: '[REDACTED]',
  },
  step: 'unified-token-introspection',
  flowType: 'unified',
});

// After response
apiCallTrackerService.updateApiCallResponse(
  callId,
  {
    status: response.status,
    statusText: response.statusText,
    data: {
      active: introspectionData.active,
      scope: introspectionData.scope,
      client_id: introspectionData.client_id,
      token_type: introspectionData.token_type,
      exp: introspectionData.exp,
      iat: introspectionData.iat,
      note: 'Token introspection validates token and returns metadata',
    },
  },
  Date.now() - introspectStartTime
);
```

---

## Testing After Implementation

After adding tracking for each flow:

1. **Run the flow** in the playground
2. **Navigate to the API Documentation page** (button at bottom of flow)
3. **Verify all API calls appear** in the documentation
4. **Check that sensitive data is redacted** (tokens, secrets, etc.)
5. **Ensure descriptions are accurate** and helpful

---

## Verification Checklist

- [ ] Authorization Code Flow
  - [ ] Authorization URL generation tracked
  - [ ] Authorization callback tracked
  - [ ] Token exchange tracked
  - [ ] API Documentation page shows 3+ calls

- [ ] Hybrid Flow
  - [ ] Authorization URL generation tracked
  - [ ] Authorization callback tracked (both query and fragment)
  - [ ] Token exchange tracked
  - [ ] API Documentation page shows 3+ calls

- [ ] Device Code Flow
  - [ ] Device authorization request tracked
  - [ ] Token polling (successful) tracked
  - [ ] API Documentation page shows 2+ calls

- [ ] Client Credentials Flow
  - [ ] Token request tracked
  - [ ] Introspection tracked (if used)
  - [ ] API Documentation page shows 1-2 calls

---

## Notes

- **Always redact sensitive data:** tokens, secrets, PKCE verifiers, authorization codes
- **Use descriptive step names:** `unified-authorization-url`, `unified-token-exchange`, etc.
- **Set isProxy correctly:** `true` if goes through `/api/*`, `false` if direct PingOne call
- **Include helpful notes:** Explain what each API call does for educational purposes
- **Follow the implicit flow pattern:** It's the reference implementation

---

## Completion

Once all flows have API call tracking:
1. Test each flow end-to-end
2. Verify API Documentation pages are complete
3. Update flow documentation files with:
   - Complete API call lists
   - ID token validation sections (for flows with ID tokens)
4. Mark TODOs as complete

**Estimated Time:** 2-4 hours for all flows + testing
