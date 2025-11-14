# Password Reset Service API Documentation

**Version:** 1.2.0  
**Last Updated:** November 7, 2025  
**Status:** ✅ Production Ready

## Table of Contents
- [Overview](#overview)
- [Version History](#version-history)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Breaking Changes Policy](#breaking-changes-policy)

## Overview

The Password Reset Service provides a comprehensive set of functions for managing user passwords in PingOne. All operations are type-safe, well-tested, and include user-friendly error messages.

### Key Features
- ✅ Type-safe TypeScript interfaces
- ✅ Comprehensive error handling
- ✅ User-friendly error messages
- ✅ Full test coverage (unit, integration, contract)
- ✅ Version tracking
- ✅ Backward compatibility guarantees

## Version History

### v1.2.0 (Current) - November 7, 2025
- Enhanced error message extraction
- User-friendly error messages for all operations
- Comprehensive error handling
- Support for password policy violations
- Support for password reuse detection

### v1.1.1 - November 7, 2025
- Fixed password check API field name
- Corrected request body format

### v1.1.0 - November 7, 2025
- Added extractErrorMessage helper
- Improved error descriptions
- Better validation error handling

### v1.0.0 - November 7, 2025
- Initial release with all password operations

## API Reference

### sendRecoveryCode

Send a password recovery code to a user via email/SMS.

```typescript
function sendRecoveryCode(
  request: SendRecoveryCodeRequest
): Promise<SendRecoveryCodeResponse>
```

**Parameters:**
```typescript
interface SendRecoveryCodeRequest {
  environmentId: string;
  userId: string;
  workerToken: string;
}
```

**Returns:**
```typescript
interface SendRecoveryCodeResponse {
  success: boolean;
  message?: string;
  error?: string;
  errorDescription?: string;
}
```

**Example:**
```typescript
const result = await sendRecoveryCode({
  environmentId: 'env-123',
  userId: 'user-456',
  workerToken: 'token-789'
});

if (result.success) {
  console.log('Recovery code sent!');
} else {
  console.error(result.errorDescription);
}
```

**Backend Endpoint:** `POST /api/pingone/password/send-recovery-code`  
**PingOne API:** `POST /v1/environments/{envId}/users/{userId}/password`  
**Content-Type:** `application/vnd.pingidentity.password.sendRecoveryCode+json`

---

### recoverPassword

Recover a password using a recovery code.

```typescript
function recoverPassword(
  environmentId: string,
  userId: string,
  workerToken: string,
  recoveryCode: string,
  newPassword: string
): Promise<PasswordOperationResponse>
```

**Parameters:**
- `environmentId` - PingOne environment ID
- `userId` - User ID
- `workerToken` - Worker app access token
- `recoveryCode` - Recovery code from email/SMS
- `newPassword` - New password to set

**Returns:**
```typescript
interface PasswordOperationResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  timestamp?: string;
  error?: string;
  errorDescription?: string;
}
```

**Example:**
```typescript
const result = await recoverPassword(
  'env-123',
  'user-456',
  'token-789',
  '123456',
  'NewPassword123!'
);

if (result.success) {
  console.log('Password recovered!', result.transactionId);
} else {
  console.error(result.errorDescription);
}
```

**Backend Endpoint:** `POST /api/pingone/password/recover`  
**PingOne API:** `POST /v1/environments/{envId}/users/{userId}/password`  
**Content-Type:** `application/vnd.pingidentity.password.recover+json`

**Common Errors:**
- `INVALID_VALUE` (recoveryCode): "The recovery code is invalid or has expired. Please request a new recovery code."
- `CONSTRAINT_VIOLATION` (newPassword): "The password does not meet the password policy requirements."
- `UNIQUENESS_VIOLATION`: "This password has been used recently. Please choose a different password."

---

### checkPassword

Verify if a password matches the user's current password.

```typescript
function checkPassword(
  environmentId: string,
  userId: string,
  workerToken: string,
  password: string
): Promise<PasswordOperationResponse>
```

**Parameters:**
- `environmentId` - PingOne environment ID
- `userId` - User ID
- `workerToken` - Worker app access token
- `password` - Password to verify

**Returns:**
```typescript
interface PasswordOperationResponse {
  success: boolean;
  valid?: boolean;  // true if password matches, false if not
  failuresRemaining?: number;  // Remaining attempts before lockout
  message?: string;
  error?: string;
  errorDescription?: string;
}
```

**Example:**
```typescript
const result = await checkPassword(
  'env-123',
  'user-456',
  'token-789',
  'TestPassword123!'
);

if (result.success) {
  if (result.valid) {
    console.log('Password is correct!');
  } else {
    console.log('Password is incorrect');
    console.log(`Attempts remaining: ${result.failuresRemaining}`);
  }
} else {
  console.error(result.errorDescription);
}
```

**Backend Endpoint:** `POST /api/pingone/password/check`  
**PingOne API:** `POST /v1/environments/{envId}/users/{userId}/password`  
**Content-Type:** `application/vnd.pingidentity.password.check+json`

**Important Notes:**
- Returns `success: true` even when password doesn't match
- Check the `valid` field to determine if password is correct
- `failuresRemaining` indicates how many attempts before account lockout

---

### forcePasswordChange

Force a user to change their password on next sign-in.

```typescript
function forcePasswordChange(
  environmentId: string,
  userId: string,
  workerToken: string
): Promise<PasswordOperationResponse>
```

**Backend Endpoint:** `POST /api/pingone/password/force-change`  
**PingOne API:** `POST /v1/environments/{envId}/users/{userId}/password`  
**Content-Type:** `application/vnd.pingidentity.password.forceChange+json`

---

### unlockPassword

Unlock a locked user account.

```typescript
function unlockPassword(
  environmentId: string,
  userId: string,
  workerToken: string
): Promise<PasswordOperationResponse>
```

**Backend Endpoint:** `POST /api/pingone/password/unlock`  
**PingOne API:** `POST /v1/environments/{envId}/users/{userId}/password`  
**Content-Type:** `application/vnd.pingidentity.password.unlock+json`

---

### readPasswordState

Get the current password state for a user.

```typescript
function readPasswordState(
  environmentId: string,
  userId: string,
  workerToken: string
): Promise<{
  success: boolean;
  passwordState?: any;
  error?: string;
  errorDescription?: string;
}>
```

**Backend Endpoint:** `GET /api/pingone/password/state`  
**PingOne API:** `GET /v1/environments/{envId}/users/{userId}/password`

**Response includes:**
- Password status (ENABLED, DISABLED, etc.)
- Force change flag
- Lock status
- Last password change date
- Failed attempts

---

### setPasswordAdmin

Set a user's password (admin operation).

```typescript
function setPasswordAdmin(
  environmentId: string,
  userId: string,
  workerToken: string,
  newPassword: string,
  options?: {
    forceChange?: boolean;
    bypassPasswordPolicy?: boolean;
  }
): Promise<PasswordOperationResponse>
```

**Backend Endpoint:** `PUT /api/pingone/password/admin-set`  
**PingOne API:** `PUT /v1/environments/{envId}/users/{userId}/password`  
**Content-Type:** `application/vnd.pingidentity.password.set+json`

---

## Error Handling

### Error Response Format

All functions return a consistent error format:

```typescript
{
  success: false,
  error: 'INVALID_DATA',
  errorDescription: 'User-friendly error message'
}
```

### Common Error Codes

| Error Code | Description | User-Friendly Message |
|------------|-------------|----------------------|
| `INVALID_VALUE` | Invalid field value | Specific message based on field |
| `CONSTRAINT_VIOLATION` | Policy violation | "The password does not meet the password policy requirements." |
| `UNIQUENESS_VIOLATION` | Password reuse | "This password has been used recently. Please choose a different password." |
| `EMPTY_VALUE` | Required field empty | "{field} must not be empty." |
| `INVALID_DATA` | General validation error | Extracted from details |

### Error Message Extraction

The service automatically extracts user-friendly messages from PingOne API errors:

```typescript
// PingOne API Error
{
  "code": "INVALID_DATA",
  "details": [{
    "code": "INVALID_VALUE",
    "target": "recoveryCode",
    "message": "The provided password recovery code was invalid or expired"
  }]
}

// Becomes
{
  success: false,
  error: "INVALID_VALUE",
  errorDescription: "The recovery code is invalid or has expired. Please request a new recovery code."
}
```

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests (requires backend running)
npm run test:integration

# Contract tests
npm run test:contract

# All tests with coverage
npm run test:coverage
```

### Test Coverage

- ✅ Unit tests: All functions
- ✅ Integration tests: Full recovery flow
- ✅ Contract tests: API compatibility
- ✅ Error handling: All error scenarios
- ✅ Type safety: TypeScript compilation

### Test Files

- `passwordResetService.test.ts` - Unit tests
- `passwordResetService.integration.test.ts` - Integration tests
- `passwordResetService.contract.test.ts` - Contract tests

## Breaking Changes Policy

### Semantic Versioning

This service follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to API
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Compatibility Guarantee

- Minor version updates are always backward compatible
- Major version updates may include breaking changes
- All breaking changes are documented in version history
- Deprecated features are marked for at least one minor version before removal

### Checking Compatibility

```typescript
import { isCompatibleVersion } from './passwordResetService.version';

if (isCompatibleVersion('1.2.0')) {
  // Safe to use
} else {
  // Update required
}
```

## Best Practices

### 1. Always Check Success Flag

```typescript
const result = await recoverPassword(...);
if (result.success) {
  // Handle success
} else {
  // Show result.errorDescription to user
}
```

### 2. Display User-Friendly Errors

```typescript
if (!result.success) {
  toast.error(result.errorDescription);  // Already user-friendly
}
```

### 3. Handle Network Errors

```typescript
try {
  const result = await recoverPassword(...);
  // Handle result
} catch (error) {
  // Handle network/unexpected errors
  toast.error('Network error occurred');
}
```

### 4. Validate Input Before API Call

```typescript
if (!email || !recoveryCode || !newPassword) {
  toast.error('Please fill in all fields');
  return;
}
```

### 5. Use TypeScript Types

```typescript
import type { PasswordOperationResponse } from './passwordResetService';

const handleRecover = async (): Promise<void> => {
  const result: PasswordOperationResponse = await recoverPassword(...);
  // TypeScript ensures type safety
};
```

## Support

For issues or questions:
1. Check this documentation
2. Review test files for examples
3. Check version history for recent changes
4. Review error messages for specific guidance

## License

Internal use only - OAuth Playground project
