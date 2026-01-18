# Verify User - Restore Documentation

## Purpose

This document provides a complete record of all fixes and functionality for the "Verify User" endpoint in the Sign-up flow. Use this document to restore functionality if it regresses or breaks.

## Critical Fixes Applied

### Fix #1: Correct Endpoint Path

**Issue:** Endpoint was using incorrect path `/users/{userId}/emailVerification`

**Fix Applied:**
- **Changed from:** `POST ${baseUrl}/users/{{SignUpUserID}}/emailVerification`
- **Changed to:** `POST ${baseUrl}/users/{{SignUpUserID}}`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~2226

**Reference:** [PingOne API Documentation - Verify User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user)

**Why:** The PingOne API endpoint for verifying a user is `POST /v1/environments/{envID}/users/{userId}`, not `/users/{userId}/emailVerification`. The incorrect path caused `INVALID_REQUEST` errors.

---

### Fix #2: Correct Content-Type Header

**Issue:** Content-Type was using incorrect value `application/vnd.pingidentity.user.emailVerification.verify+json`

**Fix Applied:**
- **Changed from:** `application/vnd.pingidentity.user.emailVerification.verify+json`
- **Changed to:** `application/vnd.pingidentity.user.verify+json`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~2230

**Why:** The PingOne API requires the Content-Type to be exactly `application/vnd.pingidentity.user.verify+json` for the verify user endpoint. The longer variant was incorrect and caused "Unsupported Media Type" errors.

---

### Fix #3: Variable Name Correction

**Issue:** Variable name was `emailVerificationToken` but should be `emailVerificationCode`

**Fix Applied:**
- **Changed from:** `{{emailVerificationToken}}`
- **Changed to:** `{{emailVerificationCode}}`

**Locations:**
- Request body: `src/services/postmanCollectionGeneratorV8.ts` line ~2234
- Console messages: lines ~2274, 2281
- Variable definitions: lines ~4985, 5144
- Variable description: line ~451

**Why:** The value is a verification code (OTP), not a token. Using "code" is more accurate and consistent with PingOne terminology.

---

## Complete Implementation

### Request Configuration

```typescript
createUseCaseItem(
    'Step 3: Verify User',
    'POST',
    `${baseUrl}/users/{{SignUpUserID}}`,  // ✅ Correct endpoint
    '**Sign-up: Verify User**\n\n**Educational Context:**\n- Verifies a user\'s email address using the verification code sent to their email\n- Endpoint: `POST {{apiPath}}/v1/environments/{{envID}}/users/{{userId}}`\n- Use POST method with Content-Type: `application/vnd.pingidentity.user.verify+json`\n- The verification code was automatically sent to the user\'s email address when the user was created (in Step 2) with lifecycle.status set to VERIFICATION_REQUIRED\n- User should enter the verification code (OTP) they received in their email\n- The request body must include the `verificationCode` property with the OTP code from the email\n- Upon successful verification, the user\'s email is marked as verified and account status is updated\n- After verification, user can proceed to set password and complete sign-up\n- Reference: [PingOne API Documentation - Verify User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user)\n\n**Request Body:**\n```json\n{\n    "verificationCode": "{{emailVerificationCode}}"\n}\n```',
    [
        { key: 'Authorization', value: 'Bearer {{workerToken}}' },
        { key: 'Content-Type', value: 'application/vnd.pingidentity.user.verify+json' },  // ✅ Correct Content-Type
        { key: 'Accept', value: 'application/json' },
    ],
    {
        verificationCode: '{{emailVerificationCode}}',  // ✅ Correct variable name
    },
    [
        // Test script...
    ],
    [
        // Pre-request script...
    ]
)
```

### Headers

```typescript
[
    { key: 'Authorization', value: 'Bearer {{workerToken}}' },
    { key: 'Content-Type', value: 'application/vnd.pingidentity.user.verify+json' },
    { key: 'Accept', value: 'application/json' },
]
```

### Request Body

```json
{
    "verificationCode": "{{emailVerificationCode}}"
}
```

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

try {
    if (pm.response.code === 200 || pm.response.code === 204) {
        pm.test("✅ User verification completed", function() {
            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);
        });
        
        console.log("✅ User verified successfully");
        
        if (pm.response.code === 200) {
            const jsonData = pm.response.json();
            if (jsonData.emailVerified !== undefined) {
                pm.environment.set("emailVerified", jsonData.emailVerified);
                console.log("   Email verified:", jsonData.emailVerified);
            }
            if (jsonData.lifecycle && jsonData.lifecycle.status) {
                pm.environment.set("userStatus", jsonData.lifecycle.status);
                console.log("   User status:", jsonData.lifecycle.status);
            }
        }
        
        console.log("📝 User account verification complete - proceed to set password");
    }
} catch (e) {
    console.log("There was an error parsing JSON", e);
    if (pm.response.code === 400) {
        try {
            const jsonData = pm.response.json();
            if (jsonData.message) {
                console.log("❌ Verification failed:", jsonData.message);
                console.log("📝 Make sure you entered the correct OTP code from your email");
            }
        } catch (e2) {
            console.log("❌ Verification failed - invalid verification code");
            console.log("📝 Please check your email for the OTP code and update the emailVerificationCode variable");
        }
    }
}
```

## Environment Variables

### Required Variables

| Variable | Type | Description | Set By |
|----------|------|-------------|--------|
| `workerToken` | string | Worker token for authentication | Worker Token step |
| `SignUpUserID` | string | User ID from user creation | Step 2: Create User |
| `emailVerificationCode` | string | OTP code from email | User input |
| `envID` | string | Environment ID | Environment config |
| `apiPath` | string | API base URL (`https://api.pingone.com`) | Environment config |

### Variable Definitions

**Location:** `src/services/postmanCollectionGeneratorV8.ts`

**In `generateUseCasesPostmanCollection`:**
```typescript
{ key: 'emailVerificationCode', value: '', type: 'string' },
```

**In `generateComprehensiveUnifiedPostmanCollection`:**
```typescript
variables.push({ key: 'emailVerificationCode', value: '', type: 'string' });
```

**Variable Description:**
```typescript
emailVerificationCode: 'Email verification code (OTP) from verification email',
```

## Validation Checklist

When restoring or verifying this functionality, ensure:

- [ ] Endpoint is: `POST /users/{userId}` (NOT `/users/{userId}/emailVerification`)
- [ ] Content-Type is exactly: `application/vnd.pingidentity.user.verify+json`
- [ ] Variable name is: `{{emailVerificationCode}}` (NOT `{{emailVerificationToken}}`)
- [ ] Request body contains: `{"verificationCode": "{{emailVerificationCode}}"}`
- [ ] Authorization header uses: `Bearer {{workerToken}}`
- [ ] Pre-request script instructs user to set `emailVerificationCode` variable
- [ ] Test script validates 200 or 204 response codes
- [ ] Error handling checks for 400 errors and provides helpful messages

## Common Errors and Solutions

### Error: "INVALID_REQUEST" - "The server is refusing to service the request because the entity of the request is in a format not supported by the requested resource for the requested method."

**Cause:** Incorrect endpoint path or Content-Type header

**Solution:**
1. Verify endpoint is: `POST /users/{userId}` (not `/users/{userId}/emailVerification`)
2. Verify Content-Type is: `application/vnd.pingidentity.user.verify+json` (not the longer variant)

### Error: "Invalid verification code"

**Cause:** Code entered incorrectly or expired

**Solution:**
1. Check code from email (typically 8 digits)
2. Ensure no extra spaces or characters
3. Verify code hasn't expired (usually valid for 15-30 minutes)

### Error: "User not found"

**Cause:** `SignUpUserID` variable not set or incorrect

**Solution:**
1. Verify Step 2 (Create User) completed successfully
2. Check `SignUpUserID` is set in environment variables
3. Ensure user was created with correct environment ID

## Testing

### Manual Test Steps

1. Create a user with email verification (Step 2)
2. Check email for verification code
3. Set `emailVerificationCode` environment variable
4. Run "Step 3: Verify User" request
5. Verify response is 200 or 204
6. Check console for success message
7. Verify `emailVerified` variable is set (if response includes it)

### Expected Results

- ✅ Status code: 200 or 204
- ✅ Console: "✅ User verified successfully"
- ✅ User can proceed to Step 4: Set Password
- ✅ User email marked as verified

## Related Files

- **Implementation:** `src/services/postmanCollectionGeneratorV8.ts` (line ~2223-2285)
- **UI Documentation:** `docs/VERIFY_USER_UI_DOC.md`
- **UI Contract:** `docs/VERIFY_USER_UI_CONTRACT.md`
- **API Reference:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user

## Version History

- **v9.0.0** - Major version bump
- **v8.1.6** - Fixed endpoint path and Content-Type header
- **v8.1.6** - Changed variable name from `emailVerificationToken` to `emailVerificationCode`

## Notes

- The endpoint path `/users/{userId}/emailVerification` was never correct - it should always be `/users/{userId}`
- The Content-Type `application/vnd.pingidentity.user.emailVerification.verify+json` was incorrect - it should be `application/vnd.pingidentity.user.verify+json`
- The variable name change from "token" to "code" is for accuracy - it's a verification code (OTP), not a token
