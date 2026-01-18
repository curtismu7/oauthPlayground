# API Call Tracking Status - All Unified Flows

**Last Updated:** 2026-01-18  
**Purpose:** Track which API calls are properly tracked for documentation in each flow type

## Overview

The OAuth Playground tracks API calls to generate comprehensive API documentation pages for each flow. This document tracks the status of API call tracking for all unified flow types.

## Tracking Requirements

For proper API documentation, each flow must track:
1. **Authorization/Authentication requests** (if applicable)
2. **Token requests** (all flows)
3. **Additional API calls** (UserInfo, introspection, etc.)

All tracking should use `apiCallTrackerService.trackApiCall()` with:
- **method**: HTTP method (GET, POST, etc.)
- **url**: The endpoint URL
- **actualPingOneUrl**: The actual PingOne URL (for proxied calls)
- **isProxy**: Boolean indicating if call goes through backend proxy
- **headers**: Request headers
- **body**: Request body (with sensitive data redacted)
- **step**: Descriptive step name (e.g., 'unified-authorization-url')
- **flowType**: 'unified' for all unified flows

## Status by Flow Type

### 1. ✅ Implicit Flow (COMPLETE)

**API Calls Tracked:**
1. ✅ **Authorization URL Generation** - `GET /as/authorize`
   - Location: `src/v8u/services/unifiedFlowIntegrationV8U.ts` (lines 306-325)
   - Step: `unified-authorization-url`
   - Notes: Tracks URL construction with all query parameters
   
2. ✅ **Authorization Callback** - `GET /as/authorize/callback`
   - Location: `src/v8u/components/UnifiedFlowSteps.tsx` (lines 2222-2249)
   - Step: `unified-authorization-callback`
   - Notes: Tracks PingOne redirect with tokens in fragment
   - Tokens are redacted in documentation

3. ✅ **UserInfo Request** - `POST /as/userinfo` (if openid scope)
   - Location: `src/v8u/components/UnifiedFlowSteps.tsx` (lines 924-964)
   - Step: `unified-userinfo`
   - Notes: Only if user clicks "Get UserInfo" button

**Status:** ✅ Complete - All implicit flow API calls are tracked

---

### 2. ⚠️ Authorization Code Flow (PARTIAL)

**API Calls That Should Be Tracked:**
1. ❌ **Authorization URL Generation** - `GET /as/authorize`
   - **Missing**: Not currently tracked
   - **Should track**: URL construction with query parameters (client_id, response_type, redirect_uri, scope, state, code_challenge, code_challenge_method)
   - **Location to add**: `src/v8u/services/unifiedFlowIntegrationV8U.ts` in `generateAuthorizationUrl()` for oauth-authz flow
   
2. ❌ **Authorization Callback** - `GET /as/authorize/callback`
   - **Missing**: Not currently tracked
   - **Should track**: PingOne redirect with authorization code
   - **Location to add**: `src/v8u/components/UnifiedFlowSteps.tsx` in callback handling for oauth-authz

3. ❌ **Token Exchange** - `POST /as/token`
   - **Missing**: Not currently tracked in standard flow
   - **Note**: IS tracked for redirectless flow (line 3641)
   - **Should track**: Authorization code exchange for tokens
   - **Location to add**: Where `exchangeCodeForTokens` is called

4. ✅ **UserInfo Request** - `POST /as/userinfo` (if openid scope)
   - **Tracked**: Same as implicit flow (line 924)

**Status:** ⚠️ Partial - Only UserInfo is tracked, missing authz URL, callback, and token exchange

---

### 3. ⚠️ Hybrid Flow (PARTIAL)

**API Calls That Should Be Tracked:**
1. ❌ **Authorization URL Generation** - `GET /as/authorize`
   - **Missing**: Not currently tracked
   - **Should track**: URL construction with response_type=code id_token
   - **Location to add**: `src/v8u/services/unifiedFlowIntegrationV8U.ts` for hybrid flow
   
2. ❌ **Authorization Callback** - `GET /as/authorize/callback`
   - **Missing**: Not currently tracked
   - **Should track**: PingOne redirect with BOTH code (query) and id_token (fragment)
   - **Location to add**: `src/v8u/components/UnifiedFlowSteps.tsx` in hybrid callback handling

3. ❌ **Token Exchange** - `POST /as/token`
   - **Missing**: Not currently tracked
   - **Should track**: Exchange authorization code for access_token and refresh_token
   - **Location to add**: Where `exchangeCodeForTokens` is called for hybrid

4. ✅ **UserInfo Request** - `POST /as/userinfo`
   - **Tracked**: Same as other flows (line 924)

**Status:** ⚠️ Partial - Only UserInfo is tracked, missing authz URL, callback, and token exchange

---

### 4. ⚠️ Client Credentials Flow (PARTIAL)

**API Calls That Should Be Tracked:**
1. ❌ **Token Request** - `POST /as/token`
   - **Missing**: Not currently tracked
   - **Should track**: Client credentials grant token request
   - **Params**: grant_type=client_credentials, client_id, client_secret (or JWT assertion), scope
   - **Location to add**: Where client credentials token request is made

2. ❌ **Token Introspection** - `POST /as/introspect` (if used)
   - **Missing**: Not currently tracked
   - **Should track**: Access token introspection
   - **Location to add**: Where introspection is called

**Status:** ⚠️ Partial - No API calls currently tracked

---

### 5. ⚠️ Device Code Flow (PARTIAL)

**API Calls That Should Be Tracked:**
1. ❌ **Device Authorization Request** - `POST /as/device_authorization`
   - **Missing**: Not currently tracked
   - **Should track**: Initial device authorization request
   - **Response**: device_code, user_code, verification_uri, verification_uri_complete
   - **Location to add**: Where device authorization is initiated

2. ❌ **Token Polling** - `POST /as/token`
   - **Missing**: Not currently tracked
   - **Should track**: Each polling attempt (but maybe summarize for docs)
   - **Params**: grant_type=urn:ietf:params:oauth:grant-type:device_code, device_code, client_id
   - **Location to add**: Where token polling occurs

3. ✅ **UserInfo Request** - `POST /as/userinfo` (if openid scope)
   - **Tracked**: Same as other flows (line 924)

**Status:** ⚠️ Partial - Only UserInfo is tracked, missing device auth request and token polling

---

### 6. ✅ Redirectless Flow (COMPLETE)

**API Calls Tracked:**
1. ✅ **Redirectless Authorization** - `POST /authorize`
   - Location: `src/v8u/components/UnifiedFlowSteps.tsx` (line 4297)
   - Step: `unified-redirectless-authorize`

2. ✅ **Resume Flow** - `POST /resume`
   - Location: `src/v8u/components/UnifiedFlowSteps.tsx` (line 3424)
   - Step: `unified-redirectless-resume`

3. ✅ **Token Exchange** - `POST /as/token`
   - Location: `src/v8u/components/UnifiedFlowSteps.tsx` (line 3641)
   - Step: `unified-redirectless-token-exchange`

**Status:** ✅ Complete - All redirectless flow API calls are tracked

---

## Action Items

### High Priority (Missing Core Flow Tracking)

1. **Authorization Code Flow**
   - [ ] Add authorization URL tracking
   - [ ] Add callback tracking
   - [ ] Add token exchange tracking

2. **Hybrid Flow**
   - [ ] Add authorization URL tracking
   - [ ] Add callback tracking (handles both code and tokens)
   - [ ] Add token exchange tracking

3. **Device Code Flow**
   - [ ] Add device authorization request tracking
   - [ ] Add token polling tracking (consider summary for docs)

4. **Client Credentials Flow**
   - [ ] Add token request tracking
   - [ ] Add introspection tracking (if used)

### Implementation Pattern

For each missing API call, follow this pattern (from implicit flow):

```typescript
// Start timing
const startTime = Date.now();

// Track the API call
const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
const apiCallId = apiCallTrackerService.trackApiCall({
  method: 'POST',  // or 'GET'
  url: actualEndpoint,
  actualPingOneUrl: actualEndpoint,
  isProxy: false,  // or true if goes through /api/*
  headers: requestHeaders,
  body: requestBody,  // Redact sensitive data!
  step: 'unified-step-name',
  flowType: 'unified',
});

// Make the actual API call
const response = await fetch(endpoint, { ... });

// Update with response
apiCallTrackerService.updateApiCallResponse(
  apiCallId,
  {
    status: response.status,
    statusText: response.statusText,
    data: responseData,  // Redact tokens!
  },
  Date.now() - startTime
);
```

### Documentation Updates Needed

After adding API call tracking:
1. Update each flow's UI Documentation with complete API call list
2. Update each flow's UI Contract with API call specifications
3. Ensure API Documentation page accurately reflects tracked calls

---

## Notes

- **Token Redaction**: Always redact actual token values in tracked calls
- **Sensitive Data**: Redact client secrets, private keys, passwords
- **Performance**: Tracking adds minimal overhead (~1-2ms per call)
- **Documentation**: Tracked calls automatically appear in API Documentation page

---

## References

- **API Call Tracker Service**: `src/services/apiCallTrackerService.ts`
- **Unified Flow Integration**: `src/v8u/services/unifiedFlowIntegrationV8U.ts`
- **Flow Steps Component**: `src/v8u/components/UnifiedFlowSteps.tsx`
- **API Documentation Page**: `src/v8u/components/UnifiedFlowDocumentationPageV8U.tsx`
