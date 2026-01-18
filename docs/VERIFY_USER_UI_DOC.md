# Verify User - User Interface Documentation

## Overview

The "Verify User" step in the Sign-up flow allows users to verify their email address using a verification code (OTP) that was automatically sent to their email when the user account was created.

## Purpose

After creating a new user account with email verification enabled, PingOne automatically sends a verification code to the user's email address. This step allows the user to enter that code to verify their email address and complete the account setup process.

## When to Use

- **Step 3** in the Sign-up (Registration) workflow
- After creating a user with `lifecycle.status: "VERIFICATION_REQUIRED"`
- When the user has received a verification code via email

## Prerequisites

1. User must be created in Step 2 with:
   - `lifecycle.status: "VERIFICATION_REQUIRED"`
   - `lifecycle.suppressVerificationCode: false`
   - Valid email address

2. User must have received verification code via email

3. Environment variable `emailVerificationCode` must be set with the OTP code from the email

## Step-by-Step Instructions

### 1. Check Your Email

- Open the email inbox for the address used when creating the user
- Look for an email from PingOne containing a verification code
- The verification code is typically 8 digits

### 2. Set the Verification Code

Before running the request, set the `emailVerificationCode` environment variable:

1. In Postman, go to the **Environment** tab
2. Find or create the variable `emailVerificationCode`
3. Enter the verification code you received in your email
4. Save the environment

### 3. Run the Request

1. Ensure you have a valid `workerToken` (obtained from Worker Token step)
2. Ensure `SignUpUserID` is set (from Step 2: Create User)
3. Click **Send** to execute the request

### 4. Verify Success

- **Status Code:** 200 or 204 indicates success
- **Console Output:** "✅ User verified successfully"
- **Next Step:** Proceed to Step 4: Set User Password

## Request Details

**Method:** POST  
**Endpoint:** `{{apiPath}}/v1/environments/{{envID}}/users/{{SignUpUserID}}`

**Headers:**
- `Authorization: Bearer {{workerToken}}`
- `Content-Type: application/vnd.pingidentity.user.verify+json`
- `Accept: application/json`

**Request Body:**
```json
{
    "verificationCode": "{{emailVerificationCode}}"
}
```

## Expected Response

**Success (200 or 204):**
- User's email is marked as verified
- Account status is updated
- User can proceed to set password

**Error (400):**
- Invalid or expired verification code
- Check console for specific error message
- Verify the code was entered correctly

## Troubleshooting

### Error: "Invalid verification code"
- **Cause:** Code entered incorrectly or code has expired
- **Solution:** 
  - Double-check the code from your email
  - Ensure no extra spaces or characters
  - Request a new verification code if expired

### Error: "User not found"
- **Cause:** `SignUpUserID` variable is not set or incorrect
- **Solution:** 
  - Verify Step 2 (Create User) completed successfully
  - Check that `SignUpUserID` is set in environment variables

### Error: "INVALID_REQUEST" or "Unsupported Media Type"
- **Cause:** Incorrect Content-Type header
- **Solution:** 
  - Ensure Content-Type is exactly: `application/vnd.pingidentity.user.verify+json`
  - Verify the endpoint is: `POST /users/{userId}` (not `/users/{userId}/emailVerification`)

## Related Steps

- **Previous:** Step 2: Create User
- **Next:** Step 4: Set User Password

## Reference

- [PingOne API Documentation - Verify User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user)
