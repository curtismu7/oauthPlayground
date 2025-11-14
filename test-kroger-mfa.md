# Kroger MFA Flow - Testing Guide

## Test URL
https://localhost:3000/flows/kroger-grocery-store-mfa

## Testing Steps

### Step 1: Initial Load
- [ ] Page loads without errors
- [ ] Kroger branding visible
- [ ] Login form displayed

### Step 2: Login
- [ ] Enter username (default: john.doe@example.com)
- [ ] Enter password (default: P@ssw0rd123!)
- [ ] Click "Sign In to Your Account"
- [ ] Should authenticate successfully

### Step 3: MFA Device Selection
- [ ] MFA modal appears
- [ ] Three options visible: SMS, EMAIL, AUTH_APP
- [ ] "Setup SMS Verification" button enabled

### Step 4: SMS Device Registration
- [ ] Click "Setup SMS Verification"
- [ ] Phone number input appears
- [ ] Enter phone number (e.g., +15551234567)
- [ ] Click "Register Device" button
- [ ] Should show success message
- [ ] Should move to code verification step

### Step 5: SMS Code Verification
- [ ] Code input field appears
- [ ] Enter 6-digit code
- [ ] Click "Verify Code"
- [ ] Should verify successfully
- [ ] Should complete MFA flow

## Common Issues to Check

### Issue 1: Worker Token Missing
**Symptom**: "Missing required information for device registration"
**Fix**: Ensure worker token is obtained before MFA setup

### Issue 2: User ID Not Found
**Symptom**: API error "User not found"
**Fix**: Check that userInfo.id is populated after login

### Issue 3: Phone Number Format
**Symptom**: "Invalid phone number"
**Fix**: Ensure phone number includes country code (+1)

### Issue 4: Environment ID Missing
**Symptom**: "Missing environment ID"
**Fix**: Check credentials are loaded from storage

### Issue 5: API Endpoint Error
**Symptom**: 404 or 500 error
**Fix**: Verify PingOne API URL and credentials

## Debug Checklist

Before testing SMS registration:
- [ ] Worker token exists and is valid
- [ ] Environment ID is set
- [ ] User is authenticated (userInfo populated)
- [ ] User ID is available
- [ ] Phone number input is visible
- [ ] Register button is enabled

## Expected API Call

```http
POST https://api.pingone.com/{environmentId}/users/{userId}/devices
Authorization: Bearer {workerToken}
Content-Type: application/vnd.pingidentity.device.sms+json

{
  "type": "SMS",
  "phoneNumber": "+15551234567",
  "name": "My Phone"
}
```

## Test Credentials

Use these for testing:
- **Username**: john.doe@example.com
- **Password**: P@ssw0rd123!
- **Phone**: +15551234567

## Next Steps

1. Open browser to https://localhost:3000/flows/kroger-grocery-store-mfa
2. Open browser console (F12)
3. Follow testing steps above
4. Note any errors in console
5. Report findings

---

Ready to test!
