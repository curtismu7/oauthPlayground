# Postman Collection Generator - Restore Documentation

## Purpose

This document provides a complete record of all features, fixes, and functionality for the Postman Collection Generator. Use this document to restore functionality if it regresses or breaks.

## Version Information

**Current Version:** `9.0.0`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~9

```typescript
export const COLLECTION_VERSION = '9.0.0';
```

## Critical Fixes Applied

### Fix #1: Verify User Endpoint and Content-Type

**Issue:** Verify User endpoint was using incorrect path and Content-Type

**Fix Applied:**
- **Endpoint:** Changed from `/users/{userId}/emailVerification` to `/users/{userId}`
- **Content-Type:** Changed from `application/vnd.pingidentity.user.emailVerification.verify+json` to `application/vnd.pingidentity.user.verify+json`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~2226, 2230

**Reference:** [PingOne API - Verify User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user)

---

### Fix #2: Variable Name Correction (emailVerificationCode)

**Issue:** Variable name was `emailVerificationToken` but should be `emailVerificationCode`

**Fix Applied:**
- Changed all references from `{{emailVerificationToken}}` to `{{emailVerificationCode}}`

**Locations:**
- Request body: line ~2234
- Console messages: lines ~2274, 2281
- Variable definitions: lines ~4985, 5144
- Variable description: line ~451

---

### Fix #3: Worker Client Credentials Always Hardcoded

**Issue:** Worker credentials were using authorization client credentials when provided

**Fix Applied:**
- Worker credentials now ALWAYS use hardcoded values
- Never override with `credentials?.clientId` or `credentials?.clientSecret`

**Locations:**
- `generateUseCasesPostmanCollection`: line ~4925
- `generateComprehensiveUnifiedPostmanCollection`: line ~5028
- `generatePostmanCollection`: line ~516

**Default Values:**
- `worker_client_id`: `'66a4686b-9222-4ad2-91b6-03113711c9aa'`
- `worker_client_secret`: `'3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC'`

---

### Fix #4: Random Username Generation via Scripts

**Issue:** Usernames were hardcoded at generation time

**Fix Applied:**
- Added `generateRandomBaseballPlayerScript()` function
- Pre-request scripts randomly select baseball players at runtime
- Sets variables: `{prefix}FirstName`, `{prefix}LastName`, `{prefix}Username`, `{prefix}Email`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~1785

**Usage:**
- Sign-up: `generateRandomBaseballPlayerScript('SignUp')`
- Sign-in: `generateRandomBaseballPlayerScript('SignIn')`

---

### Fix #5: Password Generation with Default Base

**Issue:** Passwords were hardcoded

**Fix Applied:**
- Added `generatePasswordScript()` function
- Default base: `"2Federate!"`
- Adds random 4-digit suffix (1000-9999)
- Sets both `userPassword` and `newPassword` variables

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~1824

**Usage:**
- All password-setting endpoints use this script

---

### Fix #6: JWT Assertion Generation for Client Secret JWT

**Issue:** Users had to manually create JWT assertions

**Fix Applied:**
- Added comprehensive pre-request script for Client Secret JWT worker token
- Generates JWT with HS256 signature
- Includes all required claims (iss, sub, aud, exp, iat, jti)
- Proper Base64URL encoding
- UUID generation for jti

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~4700

---

### Fix #7: URL Consistency

**Issue:** URLs had duplicate `https://` when using `{{apiPath}}` or `{{authPath}}`

**Fix Applied:**
- Updated `parseUrl()` function to handle variables correctly
- Ensures `raw` field contains complete URL
- Sets `host` to `['{{apiPath}}']` or `['{{authPath}}']` for proper Postman display

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~101

---

### Fix #8: Content-Type Header Handling

**Issue:** Some requests weren't using correct body format based on Content-Type

**Fix Applied:**
- `createUseCaseItem()` now checks Content-Type
- Raw JSON for `application/json` or `*+json` types
- Form-urlencoded for `application/x-www-form-urlencoded`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~1844

---

### Fix #9: Sign-in Flow Step Order (Added "Get the flow" Step)

**Issue:** Sign-in workflow was missing Step 2 "Get the flow" as documented in PingOne Getting Started guide

**Fix Applied:**
- Added **Step 2: Get the flow** between authorization request and submit credentials
- Updated step numbering: Step 1 (authorization) → Step 2 (get flow) → Step 3 (submit credentials) → Step 4 (resume) → Step 5 (get token)
- Added comprehensive test script to check flow status and extract `resumeUrl`
- Added PingOne documentation links to all sign-in workflow steps

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~3130

**PingOne Documentation References:**
- [Step 4: Send an authorization request](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#get-step-4-send-an-authorization-request)
- [Step 5: Get the flow](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#get-step-5-get-the-flow)
- [Step 6: Submit login credentials](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#post-step-6-submit-login-credentials)
- [Step 7: Call the resume endpoint](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#get-step-7-call-the-resume-endpoint)
- [Step 8: Get the access token](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#post-step-8-get-the-access-token)
- [Task 3: Create an SSO workflow](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#task-3-create-an-sso-workflow)

---

## Complete Feature List

### 1. Use Cases Collection

**Function:** `generateUseCasesPostmanCollection()`

**Use Cases (16 total):**
1. Sign-up (Registration)
2. Sign-in
3. MFA Enrollment
4. MFA Challenge
5. Step-up Authentication
6. Forgot Password / Password Reset
7. Account Recovery
8. Change Password
9. Social Login
10. Partner / Enterprise Federation
11. Risk-based Checks
12. Logout
13. User Sessions
14. Transaction Approval
15. PingOne Metadata
16. OAuth Login

**Structure per Use Case:**
- Environment Configuration
- Configure Your Test User
- Test The Workflow

### 2. Unified OAuth/OIDC Collection

**Function:** `generateComprehensiveUnifiedPostmanCollection()`

**Specification Versions:**
- OAuth 2.0 Authorization Framework (RFC 6749)
- OpenID Connect Core 1.0
- OAuth 2.1 Authorization Framework (draft)

**Flow Types:**
- Authorization Code Grant (7 variations)
  - Client Secret Post
  - Client Secret Basic
  - Client Secret JWT
  - Private Key JWT
  - PKCE
  - PKCE + PAR
  - PingOne Flow (redirectless)
- Implicit Flow
- Client Credentials Flow
- Device Code Flow
- Hybrid Flow

### 3. MFA Collection

**Function:** `generateComprehensiveMFAPostmanCollection()`

**Device Types (6 total):**
- SMS
- Email
- WhatsApp
- TOTP (OATH TOTP)
- FIDO2
- Mobile

**Flow Types per Device:**
- Admin Flow (ACTIVE devices)
- User Flow (ACTIVATION_REQUIRED devices)

### 4. Worker Token Generation

**Function:** `generateWorkerTokenItems()`

**Authentication Methods (4 total):**
- Client Secret Post
- Client Secret Basic
- Client Secret JWT (with JWT generation script)
- Private Key JWT

**Scope:** `openid`

### 5. Random Data Generation

**Baseball Player Selection:**
- 15 historical baseball players
- Random selection at runtime
- Email format: `cmuir+{firstName}@pingone.com`
- Username format: `{player_username}_{timestamp}`

**Password Generation:**
- Base: `"2Federate!"`
- Random suffix: 4-digit number (1000-9999)
- Example: `2Federate!4523`

### 6. Automatic Variable Extraction

**Pattern:**
```javascript
const jsonData = pm.response.json();
pm.environment.set("variableName", jsonData.property);
```

**Common Variables:**
- `workerToken`
- `access_token`, `id_token`, `refresh_token`
- `SignUpUserID`, `SignInUserID`
- `deviceId`, `deviceAuthenticationId`
- `authorization_code`
- `code_verifier`, `code_challenge`
- And 50+ more...

### 7. Educational Comments

**Format:**
- Markdown-formatted descriptions
- Educational context
- API documentation links
- Variable usage information
- Prerequisites and next steps

### 8. Pre-Request Scripts

**Types:**
- Random data generation (usernames, passwords)
- JWT assertion generation
- PKCE code generation
- Variable setup
- User instructions

### 9. Test Scripts

**Features:**
- Response validation
- Variable extraction
- Error handling
- Console logging
- Success/failure messages

## Implementation Details

### Helper Functions

#### `generateRandomBaseballPlayerScript(prefix: string)`

**Purpose:** Generate random baseball player data

**Returns:** `string[]` (script lines)

**Sets Variables:**
- `{prefix}FirstName`
- `{prefix}LastName`
- `{prefix}Username`
- `{prefix}Email`

#### `generatePasswordScript()`

**Purpose:** Generate password with default base and randomization

**Returns:** `string[]` (script lines)

**Sets Variables:**
- `userPassword`
- `newPassword`

#### `createUseCaseItem(...)`

**Purpose:** Create a Postman collection item with proper formatting

**Parameters:**
- `name: string`
- `method: string`
- `url: string`
- `description: string`
- `headers: Array<{key, value}>`
- `body?: Record<string, unknown>`
- `testScript?: string[]`
- `preRequestScript?: string[]`

**Returns:** `PostmanCollectionItem`

**Behavior:**
- Determines body format from Content-Type
- Parses URL structure
- Adds scripts as events
- Formats description

#### `parseUrl(rawUrl: string)`

**Purpose:** Parse URL string into Postman URL structure

**Returns:** Postman URL object

**Handles:**
- `{{apiPath}}` and `{{authPath}}` variables
- Query parameters
- Path segments
- Variable preservation

## Environment Variables

### Required Variables (User Must Fill)

| Variable | Type | Description |
|----------|------|-------------|
| `envID` | string | PingOne environment ID (UUID) |
| `user_client_id` | string | OAuth client ID |
| `user_client_secret` | secret | OAuth client secret |
| `redirect_uri` | string | OAuth redirect URI |

### Auto-Generated Variables

| Variable | Type | Set By |
|----------|------|--------|
| `workerToken` | string | Worker Token request |
| `access_token` | string | Token exchange |
| `id_token` | string | OIDC flows |
| `refresh_token` | string | Token exchange |
| `SignUpUserID` | string | Create User (sign-up) |
| `SignInUserID` | string | Create User (sign-in) |
| `deviceId` | string | Create Device |
| `emailVerificationCode` | string | User input |
| And 50+ more... | | Various requests |

### Default Variables

| Variable | Default Value | Notes |
|----------|---------------|-------|
| `worker_client_id` | `66a4686b-9222-4ad2-91b6-03113711c9aa` | Always hardcoded |
| `worker_client_secret` | `3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC` | Always hardcoded |
| `apiPath` | `https://api.pingone.com` | API base URL |
| `authPath` | `https://auth.pingone.com` | Auth base URL |
| `envID` | `b9817c16-9910-4415-b67e-4ac687da74d9` | Example (user should override) |

## Content-Type Headers Reference

### User Operations
- Create User (Import): `application/vnd.pingidentity.user.import+json`
- Verify User: `application/vnd.pingidentity.user.verify+json`

### Password Operations
- Set Password: `application/vnd.pingidentity.password.set+json`
- Reset Password: `application/vnd.pingidentity.password.reset+json`
- Change Password: `application/vnd.pingidentity.password.change+json`
- Recover Password: `application/vnd.pingidentity.password.recover+json`
- Send Recovery Code: `application/vnd.pingidentity.password.sendRecoveryCode` (no body)
- Force Password Change: `application/vnd.pingidentity.password.forceChange` (no body)

### MFA Operations
- Activate Device: `application/vnd.pingidentity.device.activate+json`
- Select Device: `application/vnd.pingidentity.device.select+json`
- Check OTP: `application/vnd.pingidentity.otp.check+json`

### Authentication Operations
- Username/Password Check: `application/vnd.pingidentity.usernamePassword.check+json`

### Group Operations
- Create Group: `application/vnd.pingidentity.group+json`

## Validation Checklist

When restoring or verifying functionality, ensure:

- [ ] All three collection types generate correctly
- [ ] Worker token generation works for all 4 methods
- [ ] Random username generation works (baseball players)
- [ ] Password generation works (2Federate! + random suffix)
- [ ] JWT assertion generation works (Client Secret JWT)
- [ ] Variable extraction works in test scripts
- [ ] URL parsing handles `{{apiPath}}` and `{{authPath}}` correctly
- [ ] Content-Type headers are correct for all endpoints
- [ ] Request bodies use correct format (raw JSON vs form-urlencoded)
- [ ] Educational comments are present in all requests
- [ ] Pre-request scripts execute correctly
- [ ] Test scripts validate responses
- [ ] Environment variables are properly defined
- [ ] Worker credentials are always hardcoded (never overridden)
- [ ] Verify User endpoint uses correct path and Content-Type
- [ ] Variable names are consistent (`emailVerificationCode`, not `emailVerificationToken`)
- [ ] Sign-in workflow has correct step order: Step 1 (authorization) → Step 2 (get flow) → Step 3 (submit credentials) → Step 4 (resume) → Step 5 (get token)
- [ ] All sign-in workflow steps include PingOne documentation links

## Common Errors and Solutions

### Error: "INVALID_REQUEST" on Verify User

**Cause:** Incorrect endpoint or Content-Type

**Solution:**
- Endpoint must be: `POST /users/{userId}` (NOT `/users/{userId}/emailVerification`)
- Content-Type must be: `application/vnd.pingidentity.user.verify+json`

### Error: Variables not working

**Cause:** Environment not selected or variables not set

**Solution:**
- Ensure environment is selected in Postman
- Check variable names match exactly (case-sensitive)
- Verify variables are set in environment file

### Error: Worker token fails

**Cause:** Incorrect credentials or missing envID

**Solution:**
- Verify `worker_client_id` and `worker_client_secret` are correct (hardcoded defaults)
- Check `envID` is set correctly
- Ensure credentials have proper permissions

### Error: Random data not generating

**Cause:** Pre-request scripts not executing

**Solution:**
- Check Postman console for script errors
- Verify scripts are in `event` array with `listen: 'prerequest'`
- Ensure script type is `'text/javascript'`

## File Locations

### Main Files

- **UI Component:** `src/pages/PostmanCollectionGenerator.tsx`
- **Generator Logic:** `src/services/postmanCollectionGeneratorV8.ts`
- **Version Constant:** `src/services/postmanCollectionGeneratorV8.ts` line ~9

### Documentation Files

- **UI Documentation:** `docs/POSTMAN_GENERATOR_UI_DOC.md`
- **UI Contract:** `docs/POSTMAN_GENERATOR_UI_CONTRACT.md`
- **Restore Documentation:** `docs/POSTMAN_GENERATOR_RESTORE_DOC.md` (this file)
- **Structure Reference:** `docs/POSTMAN_COLLECTION_STRUCTURE_REFERENCE.md`

## Testing Procedures

### Manual Testing

1. **Generate All Collections:**
   - Select all collection types
   - Select all use cases
   - Select all spec versions
   - Select all MFA device types
   - Generate and download

2. **Import into Postman:**
   - Import collection file
   - Import environment file
   - Select environment

3. **Test Worker Token:**
   - Run "Get Worker Token (Client Secret Post)"
   - Verify `workerToken` is set
   - Check console for success message

4. **Test Use Case:**
   - Run Sign-up flow
   - Verify random username generation
   - Verify password generation
   - Verify variable extraction

5. **Test Unified Flow:**
   - Run Authorization Code flow
   - Verify PKCE generation
   - Verify token extraction

6. **Test MFA Flow:**
   - Run SMS device registration
   - Verify device ID extraction
   - Test activation flow

### Automated Testing

- Validate collection JSON structure
- Check for required fields
- Verify no `{{undefined}}` or `{{null}}` in output
- Validate URL structures
- Check Content-Type headers

## Version History

- **v9.0.0** - Major version bump
  - Added Step 2 "Get the flow" to sign-in workflow (aligned with PingOne Getting Started documentation)
  - Added PingOne documentation links to all sign-in workflow steps
  - Updated step numbering: Step 1 (authorization) → Step 2 (get flow) → Step 3 (submit credentials) → Step 4 (resume) → Step 5 (get token)
- **v8.1.6** - Fixed Verify User endpoint and Content-Type
- **v8.1.6** - Changed variable name from `emailVerificationToken` to `emailVerificationCode`
- **v8.1.6** - Fixed worker credentials to always use hardcoded values
- **v8.1.6** - Added random username generation via scripts
- **v8.1.6** - Added password generation with default base
- **v8.1.6** - Added JWT assertion generation for Client Secret JWT
- **v8.1.6** - Fixed URL consistency with `{{apiPath}}` and `{{authPath}}`
- **v8.1.6** - Fixed Content-Type header handling for body format

## Related Documentation

### PingOne API Documentation
- [PingOne Platform API Reference](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [PingOne Getting Started Guide](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/)
- [Task 3: Create an SSO workflow](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#task-3-create-an-sso-workflow)
  - [Step 4: Send an authorization request](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#get-step-4-send-an-authorization-request)
  - [Step 5: Get the flow](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#get-step-5-get-the-flow)
  - [Step 6: Submit login credentials](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#post-step-6-submit-login-credentials)
  - [Step 7: Call the resume endpoint](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#get-step-7-call-the-resume-endpoint)
  - [Step 8: Get the access token](https://apidocs.pingidentity.com/pingone/getting-started/v1/api/#post-step-8-get-the-access-token)

### Internal Documentation
- [Postman Collection Structure Reference](./POSTMAN_COLLECTION_STRUCTURE_REFERENCE.md)
- [Verify User Documentation](./VERIFY_USER_RESTORE_DOC.md)

## Support

If functionality breaks:

1. Check this restore document
2. Verify all fixes are applied
3. Check validation checklist
4. Review common errors and solutions
5. Test manually following testing procedures
6. Check file locations for correct implementation
