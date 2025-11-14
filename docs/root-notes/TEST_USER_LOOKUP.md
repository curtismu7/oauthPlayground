# Test User Lookup Script

This script tests the user lookup functionality with "curtis7" and "cmuir@pingone.com".

## Prerequisites

1. Backend server must be running on port 3001
2. You need:
   - Environment ID
   - Worker Token (with `p1:read:user` scope)
   - Identifier to test (username or email)

## How to Get Credentials

### Option 1: From Browser Console
1. Open the password reset page: http://localhost:3000/security/password-reset
2. Open browser console (F12)
3. Run this to get credentials:
```javascript
// Get environment ID and worker token
const creds = JSON.parse(localStorage.getItem('pingone_worker_token_credentials_heliomart-password-reset') || '{}');
const token = localStorage.getItem('worker_token_heliomart-password-reset');
console.log('Environment ID:', creds.environmentId);
console.log('Worker Token:', token);
```

### Option 2: From Worker Token Modal
1. Open the password reset page
2. Click "Configure Token" button
3. The modal will show your saved credentials

## Running the Test

```bash
# Test with username
node test-user-lookup.mjs <environmentId> <workerToken> curtis7

# Test with email
node test-user-lookup.mjs <environmentId> <workerToken> cmuir@pingone.com
```

## Example

```bash
node test-user-lookup.mjs b9817c16-9910-4415-b67e-4ac687da74d9 eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9... curtis7
```

## Expected Output

### Success:
```
🧪 Testing User Lookup
============================================================
Environment ID: b9817c16-9910-4415-...
Worker Token: eyJhbGciOiJSUzI1NiIs...
Identifier: curtis7
============================================================

Status: 200 OK

✅ User found!
============================================================
User ID: 12345678-1234-1234-1234-123456789012
Username: curtis7
Email: curtis7@example.com
Name: Curtis
Match Type: username
Filter Used: username eq "curtis7"
============================================================
```

### Failure:
```
❌ User not found or error occurred
============================================================
Error: not_found
Description: No user found matching identifier: curtis7
============================================================
```


