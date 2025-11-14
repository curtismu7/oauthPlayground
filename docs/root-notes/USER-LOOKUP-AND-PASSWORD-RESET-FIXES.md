# User Lookup and Password Reset API Fixes

## Summary
Fixed the PingOne user lookup and password reset endpoints to use the correct API methods according to the official PingOne Platform API documentation.

---

## 🔍 User Lookup Fixes

### What Was Fixed
The `/api/pingone/users/lookup` endpoint in `server.js` was updated to use the **SCIM Search API** instead of client-side filtering.

### Changes Made

**Before:**
- Fetched all users with pagination (up to 500 users)
- Filtered users client-side by username/email
- Inefficient for large user bases
- Could miss users beyond the pagination limit

**After:**
- Uses SCIM search endpoint: `POST /v1/environments/{envId}/users/.search`
- Proper SCIM request format with filters
- Server-side filtering (much more efficient)
- Supports username, email, and user ID lookups

### Implementation Details

#### 1. Username Lookup
```json
POST /v1/environments/{envId}/users/.search
Content-Type: application/scim+json

{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:SearchRequest"],
  "filter": "userName eq \"curtis7\"",
  "startIndex": 1,
  "count": 10
}
```

#### 2. Email Lookup
```json
POST /v1/environments/{envId}/users/.search
Content-Type: application/scim+json

{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:SearchRequest"],
  "filter": "email eq \"cmuir@pingone.com\"",
  "startIndex": 1,
  "count": 10
}
```

#### 3. User ID Lookup
```
GET /v1/environments/{envId}/users/{userId}
```

### Features
- ✅ Automatic detection of identifier type (UUID, email, or username)
- ✅ SCIM search for username and email
- ✅ Direct API call for user ID
- ✅ Fallback search (if username fails, tries email)
- ✅ Returns `matchType` indicator (id, username, email)

---

## 🔐 Password Reset Fixes

### What Was Fixed
All password-related endpoints were updated to use the correct HTTP methods and request formats.

### Changes Made

| Endpoint | Before | After |
|----------|--------|-------|
| **Method** | POST with custom content types | PUT with standard JSON |
| **Content-Type** | `application/vnd.pingidentity.password.*+json` | `application/json` |
| **Password Field** | `password` | `value` |
| **Policy Bypass** | `bypassPasswordPolicy: true` | `verifyPolicy: false` |
| **User Change** | `oldPassword` + `newPassword` | `currentPassword` + `value` |

### Fixed Endpoints

#### 1. Force Password Change
```javascript
PUT /v1/environments/{envId}/users/{userId}/password
Content-Type: application/json

{
  "forceChange": true
}
```

#### 2. Change Password (User-Initiated)
```javascript
PUT /v1/environments/{envId}/users/{userId}/password
Content-Type: application/json

{
  "currentPassword": "oldPassword123!",
  "value": "newPassword456!"
}
```

#### 3. Set Password (Admin)
```javascript
PUT /v1/environments/{envId}/users/{userId}/password
Content-Type: application/json

{
  "value": "newPassword789!",
  "forceChange": false,
  "verifyPolicy": true
}
```

#### 4. LDAP Gateway Password Set
```javascript
PUT /v1/environments/{envId}/users/{userId}/password
Content-Type: application/json

{
  "value": "newPassword101!",
  "ldapGatewayId": "optional-gateway-id",
  "forceChange": false,
  "verifyPolicy": true
}
```

---

## 🧪 Testing

### Prerequisites
To test the user lookup API, you need:

1. **Worker App Configuration**
   - Configure your PingOne application as a Worker App
   - Assign role: "Identity Data Admin" or "Identity Data Read Only"
   - Enable client credentials grant type

2. **Get Worker Token**
   ```bash
   curl -X POST "https://auth.pingone.com/{envId}/as/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id={clientId}&client_secret={clientSecret}"
   ```

### Test Cases

#### Test 1: Username Lookup (curtis7)
```bash
curl -X POST http://localhost:3001/api/pingone/users/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "environmentId": "b9817c16-9910-4415-b67e-4ac687da74d9",
    "accessToken": "YOUR_WORKER_TOKEN",
    "identifier": "curtis7"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "user-id-here",
    "userName": "curtis7",
    "email": "cmuir@pingone.com",
    "name": {
      "given": "Curtis",
      "family": "Muir"
    },
    "enabled": true
  },
  "matchType": "username"
}
```

#### Test 2: Email Lookup (cmuir@pingone.com)
```bash
curl -X POST http://localhost:3001/api/pingone/users/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "environmentId": "b9817c16-9910-4415-b67e-4ac687da74d9",
    "accessToken": "YOUR_WORKER_TOKEN",
    "identifier": "cmuir@pingone.com"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "user-id-here",
    "userName": "curtis7",
    "email": "cmuir@pingone.com",
    "name": {
      "given": "Curtis",
      "family": "Muir"
    },
    "enabled": true
  },
  "matchType": "email"
}
```

### Using Test Scripts

Run the demo script to see implementation details:
```bash
node test-user-lookup-demo.mjs
```

Run the actual test (requires valid worker token):
```bash
node test-user-lookup.mjs <environmentId> <workerToken> <identifier>
```

---

## 📚 API Documentation References

- **SCIM User Search**: https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-read-all-scim-users-search
- **User Passwords**: https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords
- **Read User**: https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user

---

## ✅ Verification

### Server Status
```bash
curl http://localhost:3001/api/health
```

### Endpoints Updated
- ✅ `/api/pingone/users/lookup` - SCIM search implementation
- ✅ `/api/pingone/password/force-change` - PUT with JSON
- ✅ `/api/pingone/password/change` - PUT with currentPassword/value
- ✅ `/api/pingone/password/admin-set` - PUT with value field
- ✅ `/api/pingone/password/set` - PUT with value field
- ✅ `/api/pingone/password/set-value` - PUT with value field
- ✅ `/api/pingone/password/ldap-gateway` - PUT with value field

---

## 🔧 Configuration Notes

### Current Client Configuration
The client in `.env` (`a4f963ea-0736-456a-be72-b1fa4f63f81f`) is **not configured as a Worker App**.

To enable testing:
1. Go to PingOne Admin Console
2. Navigate to Applications
3. Select your application
4. Enable "Worker" application type
5. Assign appropriate roles (Identity Data Admin)
6. Save changes

### Alternative: Use Existing Worker App
If you have a separate Worker App configured:
1. Get its client ID and secret
2. Use it to obtain a worker token
3. Use that token for testing

---

## 🎯 Next Steps

1. **Configure Worker App** in PingOne Console
2. **Get Worker Token** using client credentials
3. **Test User Lookup** with curtis7 and cmuir@pingone.com
4. **Test Password Reset** operations
5. **Verify** all operations work as expected

---

## 📝 Notes

- All changes follow PingOne Platform API v1 specifications
- SCIM search is more efficient than client-side filtering
- Password operations now use standard JSON format
- All endpoints include proper error handling and logging
