# Comprehensive API Tracking Plan for Unified Flows

**Created:** 2026-01-18  
**Status:** In Progress  
**Goal:** Track and document EVERY API call made by unified flows

---

## 📋 COMPLETE API CALL INVENTORY

### 1. **Worker Token Management** ⏳ NOT TRACKED
**Service:** `workerTokenServiceV8.ts`  
**Location:** `src/v8/services/workerTokenServiceV8.ts`

**API Calls:**
- **Get Worker Token (Silent)**: When "Silent API" is enabled
  - Method: `POST`
  - Endpoint: `/api/worker-token`
  - Backend Proxy: `/api/worker-token` → PingOne OAuth Token endpoint
  - Request: Client credentials grant
  - Response: Worker access token
  - **Usage:** Background token retrieval for management API calls
  
- **Get Worker Token (Modal)**: When user explicitly requests
  - Same as above, but triggered by user action
  - Shows modal with token display

**Tracking Needed:**
```typescript
// In workerTokenServiceV8.ts - getToken() method
apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: '/api/worker-token',
  actualPingOneUrl: `https://auth.pingone.com/${envId}/as/token`,
  body: { grant_type: 'client_credentials', scope: 'p1:read:* p1:update:*' },
  step: 'worker-token-retrieval',
  flowType: 'management-api'
});
```

---

### 2. **Application Discovery** ⏳ NOT TRACKED
**Service:** `appDiscoveryServiceV8.ts`  
**Location:** `src/v8/services/appDiscoveryServiceV8.ts`

**API Calls:**
- **List Applications**
  - Method: `GET`
  - Endpoint: `/api/pingone/applications`
  - Backend Proxy: `/api/pingone/applications` → `https://api.pingone.com/v1/environments/{envId}/applications`
  - Auth: Worker token (Bearer)
  - Response: Array of applications
  - **Usage:** Application picker/search functionality

- **Get Application Details (with secret)**
  - Method: `GET`
  - Endpoint: `/api/pingone/applications/{appId}`
  - Backend Proxy: `https://api.pingone.com/v1/environments/{envId}/applications/{appId}/secret`
  - Auth: Worker token (Bearer)
  - Response: Application object with client secret
  - **Usage:** Auto-fill credentials when app is selected

**Tracking Needed:**
```typescript
// In appDiscoveryServiceV8.ts - discoverApplications()
apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: '/api/pingone/applications',
  actualPingOneUrl: `https://api.pingone.com/v1/environments/${envId}/applications`,
  headers: { Authorization: 'Bearer ***' },
  step: 'application-discovery',
  flowType: 'management-api'
});

// In appDiscoveryServiceV8.ts - fetchApplicationWithSecret()
apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: `/api/pingone/applications/${appId}`,
  actualPingOneUrl: `https://api.pingone.com/v1/environments/${envId}/applications/${appId}/secret`,
  headers: { Authorization: 'Bearer ***' },
  step: 'application-details',
  flowType: 'management-api'
});
```

---

### 3. **OIDC Discovery** ⏳ NOT TRACKED
**Service:** `oidcDiscoveryServiceV8.ts`  
**Location:** `src/v8/services/oidcDiscoveryServiceV8.ts`

**API Calls:**
- **Fetch OIDC Configuration**
  - Method: `GET`
  - Endpoint: `/api/pingone/oidc-discovery`
  - Backend Proxy: → `{issuerUrl}/.well-known/openid-configuration`
  - Auth: None (public endpoint)
  - Response: OIDC discovery document
  - **Usage:** Auto-configure endpoints, supported features

**Tracking Needed:**
```typescript
// In oidcDiscoveryServiceV8.ts - discover()
apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: '/api/pingone/oidc-discovery',
  actualPingOneUrl: `${issuerUrl}/.well-known/openid-configuration`,
  step: 'oidc-discovery',
  flowType: 'oidc-metadata'
});
```

---

### 4. **JWKS Fetching** ⏳ NOT TRACKED
**Service:** `jwksCacheServiceV8.ts`, `idTokenValidationServiceV8.ts`  
**Location:** `src/v8/services/`

**API Calls:**
- **Fetch JWKS (JSON Web Key Set)**
  - Method: `GET`
  - Endpoint: Direct fetch to `{issuerUrl}/.well-known/jwks.json`
  - Auth: None (public endpoint)
  - Response: JWKS document with signing keys
  - **Usage:** ID token signature verification

**Tracking Needed:**
```typescript
// In jwksCacheServiceV8.ts - fetchJWKS() or similar
apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: `${jwksUri}`,
  actualPingOneUrl: `${jwksUri}`,
  step: 'jwks-fetch',
  flowType: 'oidc-metadata'
});
```

---

### 5. **Pre-flight Validation** ⏳ NOT TRACKED
**Service:** `preFlightValidationServiceV8.ts`  
**Location:** `src/v8/services/preFlightValidationServiceV8.ts`

**API Calls:**
- **Get Application Configuration**
  - Method: `GET`
  - Endpoint: `/api/pingone/applications/{appId}`
  - Backend Proxy: → `https://api.pingone.com/v1/environments/{envId}/applications/{appId}`
  - Auth: Worker token (Bearer)
  - Response: Application configuration
  - **Usage:** Validate redirect URI, auth method, grant types before making auth request

**Tracking Needed:**
```typescript
// In preFlightValidationServiceV8.ts - validateOAuthConfig()
apiCallTrackerService.trackApiCall({
  method: 'GET',
  url: `/api/pingone/applications/${clientId}`,
  actualPingOneUrl: `https://api.pingone.com/v1/environments/${envId}/applications/${clientId}`,
  headers: { Authorization: 'Bearer ***' },
  step: 'preflight-validation',
  flowType: 'management-api'
});
```

---

### 6. **PAR (Pushed Authorization Requests)** ⏳ NOT TRACKED
**Service:** `parServiceV8.ts` (if exists) or in authorization flow services  
**Location:** TBD

**API Calls:**
- **Push Authorization Request**
  - Method: `POST`
  - Endpoint: `/api/par` or direct to PingOne PAR endpoint
  - Backend Proxy: → `https://auth.pingone.com/{envId}/as/par`
  - Auth: Client credentials (basic or post)
  - Body: All authorization parameters
  - Response: `request_uri` for use in authorization request
  - **Usage:** Enhanced security for authorization requests

**Tracking Needed:**
```typescript
// In PAR service or authorization URL generation
apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: '/api/par',
  actualPingOneUrl: `https://auth.pingone.com/${envId}/as/par`,
  body: { /* all auth params */ },
  step: 'par-push-request',
  flowType: 'oauth-par'
});
```

---

### 7. **Token Introspection** ✅ ALREADY TRACKED
**Service:** `tokenOperationsServiceV8.ts`  
**Status:** Already tracked in existing flows

---

### 8. **UserInfo** ✅ ALREADY TRACKED
**Service:** Various flow services  
**Status:** Already tracked in existing flows

---

### 9. **Token Refresh** ⏳ PARTIALLY TRACKED
**Service:** Token operations  
**Status:** May need additional tracking in unified flows

**API Calls:**
- **Refresh Access Token**
  - Method: `POST`
  - Endpoint: `/api/token-exchange` or `/api/refresh-token`
  - Backend Proxy: → Token endpoint
  - Body: `{ grant_type: 'refresh_token', refresh_token: '...' }`
  - Response: New access token (and optionally new refresh token)

**Tracking Needed:**
```typescript
// In token refresh handlers
apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: '/api/token-exchange',
  actualPingOneUrl: tokenEndpoint,
  body: { grant_type: 'refresh_token', refresh_token: '***' },
  step: 'token-refresh',
  flowType: 'oauth-token-refresh'
});
```

---

## 📊 TRACKING PRIORITY

### **HIGH PRIORITY** (User-facing, frequently used)
1. ✅ Worker Token retrieval (both silent and modal)
2. ✅ Application Discovery (list apps)
3. ✅ Application Details (get client secret)
4. ✅ OIDC Discovery

### **MEDIUM PRIORITY** (Important for debugging)
5. ✅ JWKS fetching
6. ✅ Pre-flight validation
7. ✅ Token Refresh

### **LOW PRIORITY** (Advanced features)
8. ⏳ PAR (Pushed Authorization Requests) - if implemented

---

## 🎯 IMPLEMENTATION STRATEGY

### Phase 1: Core Management API Calls (PRIORITY)
1. **Worker Token retrieval** - Track in `workerTokenServiceV8.ts`
2. **Application Discovery** - Track in `appDiscoveryServiceV8.ts`
3. **Application Details** - Track in `appDiscoveryServiceV8.ts`

### Phase 2: OIDC Metadata Calls
4. **OIDC Discovery** - Track in `oidcDiscoveryServiceV8.ts`
5. **JWKS fetching** - Track in `jwksCacheServiceV8.ts`

### Phase 3: Validation & Advanced
6. **Pre-flight validation** - Track in `preFlightValidationServiceV8.ts`
7. **Token Refresh** - Track in token operation handlers
8. **PAR** - Track if/when implemented

---

## 📝 DOCUMENTATION SECTIONS NEEDED

Each tracked API call should appear in:

1. **API Documentation Page** - Collapsible section showing:
   - Request details (method, URL, headers, body)
   - Response (structure and example)
   - When it's called
   - Why it's needed

2. **Flow Documentation** - Mention in:
   - UI Documentation (user-facing)
   - UI Contract (technical specs)
   - Restore documents (for recovery)

3. **Separate Section Headers** - Group by category:
   - "🔐 Management API Calls" (Worker Token, App Discovery)
   - "📋 OIDC Metadata" (Discovery, JWKS)
   - "✅ Pre-flight Validation"
   - "🔄 OAuth Flow" (Authorization, Token Exchange, etc.)

---

## 🔍 BENEFITS OF COMPLETE TRACKING

1. **Educational** - Users see EVERY API call the app makes
2. **Debugging** - Easy to spot failed/missing calls
3. **Transparency** - No "hidden" API calls
4. **Documentation** - Auto-generates complete API reference
5. **Postman Collections** - Can generate complete collections
6. **Security Auditing** - See exactly what data is sent/received

---

## ✅ SUCCESS CRITERIA

- [ ] Every API call is tracked with `apiCallTrackerService`
- [ ] All tracked calls appear in "API Documentation" page
- [ ] Calls are grouped by category (Management API, OAuth, OIDC Metadata)
- [ ] Each call shows request/response details
- [ ] Educational notes explain WHY each call is needed
- [ ] Postman collections include ALL calls
- [ ] No "mystery" API calls in network tab

---

## 📅 NEXT STEPS

1. Implement Phase 1 (Worker Token + App Discovery)
2. Test on all flow types
3. Update API Documentation page with new sections
4. Implement Phase 2 (OIDC Discovery + JWKS)
5. Update all flow documentation
6. Implement Phase 3 (Pre-flight + Token Refresh)
7. Final testing and documentation review
