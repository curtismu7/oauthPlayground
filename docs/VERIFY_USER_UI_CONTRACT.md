# Verify User - UI Contract (Technical Specification)

## API Contract

### Endpoint
```
POST {{apiPath}}/v1/environments/{{envID}}/users/{{userId}}
```

**Base URL:** `{{apiPath}}/v1/environments/{{envID}}`  
**Path:** `/users/{{userId}}`  
**Method:** `POST`

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Authorization` | `Bearer {{workerToken}}` | Yes | Worker token for authentication |
| `Content-Type` | `application/vnd.pingidentity.user.verify+json` | Yes | Must be exact match |
| `Accept` | `application/json` | Yes | Response format |

### Request Body

**Content-Type:** `application/vnd.pingidentity.user.verify+json`

```json
{
    "verificationCode": "string"
}
```

**Properties:**
- `verificationCode` (string, required): The OTP code received via email

### Response

**Success (200 OK or 204 No Content):**
- User email is verified
- Account status updated
- May include user object in response body (200) or empty body (204)

**Error (400 Bad Request):**
```json
{
    "id": "uuid",
    "code": "INVALID_REQUEST",
    "message": "Invalid verification code"
}
```

**Error (404 Not Found):**
```json
{
    "id": "uuid",
    "code": "NOT_FOUND",
    "message": "User not found"
}
```

## Postman Collection Implementation

### Request Configuration

**Location:** `src/services/postmanCollectionGeneratorV8.ts` (line ~2223)

```typescript
createUseCaseItem(
    'Step 3: Verify User',
    'POST',
    `${baseUrl}/users/{{SignUpUserID}}`,  // Correct endpoint
    description,
    [
        { key: 'Authorization', value: 'Bearer {{workerToken}}' },
        { key: 'Content-Type', value: 'application/vnd.pingidentity.user.verify+json' },  // Correct Content-Type
        { key: 'Accept', value: 'application/json' },
    ],
    {
        verificationCode: '{{emailVerificationCode}}',  // Correct variable name
    },
    testScript,
    preRequestScript
)
```

### Required Environment Variables

| Variable | Type | Description | Source |
|----------|------|-------------|--------|
| `workerToken` | string | Worker token for API authentication | Worker Token step |
| `SignUpUserID` | string | User ID from Step 2 | Step 2: Create User |
| `emailVerificationCode` | string | OTP code from email | User input |
| `envID` | string | Environment ID | Environment configuration |
| `apiPath` | string | API base URL | Environment configuration |

### Pre-Request Script

```javascript
console.log("📝 IMPORTANT: Enter the OTP (verification code) you received in your email");
console.log("📝 Set the emailVerificationCode environment variable with the OTP code before running this request");
console.log("📝 The OTP code was sent to the user's email address when the user was created in Step 2");
console.log("📝 Check your email inbox for the verification code (typically 8 digits)");
```

### Test Script

```javascript
pm.test("✅ Call was Successful - User Verified", function() {
    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);
});

// Extract and validate response
if (pm.response.code === 200 || pm.response.code === 204) {
    pm.test("✅ User verification completed", function() {
        pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);
    });
    
    console.log("✅ User verified successfully");
    
    // Save email verification status if available
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        if (jsonData.emailVerified !== undefined) {
            pm.environment.set("emailVerified", jsonData.emailVerified);
        }
        if (jsonData.lifecycle && jsonData.lifecycle.status) {
            pm.environment.set("userStatus", jsonData.lifecycle.status);
        }
    }
    
    console.log("📝 User account verification complete - proceed to set password");
}
```

## Validation Rules

### Endpoint Validation
- ✅ Must be: `POST /users/{userId}` (NOT `/users/{userId}/emailVerification`)
- ✅ `userId` must be a valid UUID from previous step

### Content-Type Validation
- ✅ Must be exactly: `application/vnd.pingidentity.user.verify+json`
- ❌ NOT: `application/vnd.pingidentity.user.emailVerification.verify+json`
- ❌ NOT: `application/json`

### Request Body Validation
- ✅ Must include `verificationCode` property
- ✅ `verificationCode` must be a string
- ✅ Variable name must be `{{emailVerificationCode}}` (NOT `{{emailVerificationToken}}`)

### Authentication Validation
- ✅ Must use `Bearer {{workerToken}}` (NOT user access token)
- ✅ Worker token must be valid and not expired

## Error Handling

### Common Errors

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| 400 | INVALID_REQUEST | Incorrect Content-Type or endpoint | Verify Content-Type is `application/vnd.pingidentity.user.verify+json` and endpoint is `/users/{userId}` |
| 400 | Invalid verification code | Code incorrect or expired | Check code from email, ensure no extra spaces |
| 401 | Unauthorized | Invalid or missing worker token | Regenerate worker token |
| 404 | User not found | Invalid userId | Verify `SignUpUserID` is set correctly |

## Dependencies

### Prerequisites
1. **Step 2: Create User** must complete successfully
   - Sets `SignUpUserID` variable
   - User created with `lifecycle.status: "VERIFICATION_REQUIRED"`
   - Verification email sent automatically

2. **Worker Token** must be obtained
   - Required for authentication
   - Must be valid and not expired

### Post-Verification
- User can proceed to **Step 4: Set User Password**
- User account status updated to verified
- Email marked as verified in user profile

## Reference Implementation

**File:** `src/services/postmanCollectionGeneratorV8.ts`  
**Function:** `generateUseCasesItems()`  
**Line:** ~2223-2285  
**Use Case:** Sign-up (Registration) flow

## API Documentation Reference

- [PingOne API - Verify User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user)
