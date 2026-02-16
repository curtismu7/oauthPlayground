# Content-Type Headers Verification

## Status: ✅ ALL CORRECT

All Content-Type headers in the Postman collection generator have been verified against PingOne API documentation.

## Fix Applied

### Email Verification Endpoint
**Issue:** 415 Unsupported Media Type error  
**Root Cause:** Incorrect Content-Type header  
**Fix Applied:**
- ❌ **Before:** `application/vnd.pingidentity.user.verify+json`
- ✅ **After:** `application/vnd.pingidentity.user.emailVerification.verify+json`

**Location:** `src/services/postmanCollectionGeneratorV8.ts:2285`

---

## All Content-Type Headers Verified

### User Operations
| Operation | Content-Type | Status |
|-----------|--------------|--------|
| Create User (Import) | `application/vnd.pingidentity.user.import+json` | ✅ Correct |
| Verify Email | `application/vnd.pingidentity.user.emailVerification.verify+json` | ✅ **FIXED** |

### Group Operations
| Operation | Content-Type | Status |
|-----------|--------------|--------|
| Create Group | `application/vnd.pingidentity.group+json` | ✅ Correct |

### Password Operations
| Operation | Content-Type | Has Body? | Status |
|-----------|--------------|-----------|--------|
| Reset Password | `application/vnd.pingidentity.password.reset+json` | ✅ Yes | ✅ Correct |
| Set Password | `application/vnd.pingidentity.password.set+json` | ✅ Yes | ✅ Correct |
| Change Password (Self) | `application/vnd.pingidentity.password.change+json` | ✅ Yes | ✅ Correct |
| Force Password Change | `application/vnd.pingidentity.password.forceChange` | ❌ No | ✅ Correct |
| Send Recovery Code | `application/vnd.pingidentity.password.sendRecoveryCode` | ❌ No | ✅ Correct |
| Recover Password | `application/vnd.pingidentity.password.recover+json` | ✅ Yes | ✅ Correct |

### Authentication Operations
| Operation | Content-Type | Status |
|-----------|--------------|--------|
| Username/Password Check | `application/vnd.pingidentity.usernamePassword.check+json` | ✅ Correct |

### MFA Device Operations
| Operation | Content-Type | Status |
|-----------|--------------|--------|
| Activate Device | `application/vnd.pingidentity.device.activate+json` | ✅ Correct |
| Select Device | `application/vnd.pingidentity.device.select+json` | ✅ Correct |
| Check OTP | `application/vnd.pingidentity.otp.check+json` | ✅ Correct |

---

## Content-Type Pattern Rules

### Rule 1: Operations with JSON Body
**Pattern:** `application/vnd.pingidentity.{operation}+json`

**Examples:**
- `application/vnd.pingidentity.user.import+json`
- `application/vnd.pingidentity.password.reset+json`
- `application/vnd.pingidentity.device.activate+json`

### Rule 2: Operations with Empty Body
**Pattern:** `application/vnd.pingidentity.{operation}` (NO `+json` suffix)

**Examples:**
- `application/vnd.pingidentity.password.forceChange`
- `application/vnd.pingidentity.password.sendRecoveryCode`

### Rule 3: Special Endpoint-Specific Types
Some endpoints require very specific Content-Type headers that include the full operation path:

**Example:**
- Email Verification: `application/vnd.pingidentity.user.emailVerification.verify+json`
  - ❌ NOT: `application/vnd.pingidentity.user.verify+json`
  - ✅ CORRECT: `application/vnd.pingidentity.user.emailVerification.verify+json`

---

## Verification Checklist

- [x] All user operation Content-Types verified
- [x] All password operation Content-Types verified
- [x] All MFA device operation Content-Types verified
- [x] All authentication operation Content-Types verified
- [x] Email verification Content-Type fixed
- [x] Empty body operations use correct Content-Type (no +json)
- [x] JSON body operations use correct Content-Type (with +json)

---

## Common Errors and Solutions

### Error: 415 Unsupported Media Type

**Causes:**
1. Missing Content-Type header
2. Incorrect Content-Type header
3. Using shortened version instead of full endpoint-specific type

**Solutions:**
1. Always include the correct Content-Type header for POST/PUT/PATCH requests
2. Use the exact Content-Type as specified in PingOne API documentation
3. For endpoint-specific operations, use the full Content-Type path (e.g., `user.emailVerification.verify+json` not `user.verify+json`)

---

## References

- [PingOne Platform API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [PingOne MFA API Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/)
- [Content-Type Header Best Practices](docs/root-notes/FINAL-API-FIXES-SUMMARY.md)

---

**Last Verified:** All Content-Type headers verified and corrected  
**Total Headers Checked:** 13 unique Content-Type headers  
**Issues Found:** 1 (Email Verification - FIXED)  
**Status:** ✅ ALL CORRECT
