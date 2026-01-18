# P1MFA SDK - Quick Start Guide

**Version:** 1.0.0  
**Status:** Ready for Use

This guide provides a quick start for using the P1MFA SDK sample applications in OAuth Playground.

---

## Accessing the Samples

1. **From Sidebar Menu:**
   - Navigate to "Token Management" section
   - Click "📦 P1MFA SDK Samples"

2. **Direct URLs:**
   - Main page: `/samples/p1mfa`
   - Integrated sample: `/samples/p1mfa/integrated`
   - FIDO2 sample: `/samples/p1mfa/fido2`
   - SMS sample: `/samples/p1mfa/sms`

---

## Quick Start: Integrated Sample

The **Integrated Sample** demonstrates the complete flow:

1. **Environment Config**
   - Enter PingOne Environment ID
   - Enter Client ID and Client Secret (for worker token)
   - Enter Device Authentication Policy ID

2. **OIDC Sign-in**
   - Click "Start OIDC Sign-in"
   - Complete authentication in PingOne
   - Get redirected back with tokens
   - User ID extracted from ID token

3. **MFA Enrollment**
   - **SMS:** Enter phone number → Register → Enter OTP → Activate
   - **FIDO2:** Register device → Create WebAuthn credential → Activate

4. **MFA Authentication**
   - **SMS:** Initialize → Enter OTP → Complete
   - **FIDO2:** Initialize → Get WebAuthn assertion → Complete

---

## Quick Start: Individual Samples

### FIDO2 Sample App

**Location:** `/samples/p1mfa/fido2`

**Tabs:**
- **Credentials:** Initialize SDK
- **Registration:** Enroll FIDO2 device
- **Authentication:** Authenticate with FIDO2
- **Devices:** View and manage devices

**Flow:**
1. Initialize SDK with PingOne credentials
2. Enter User ID and Policy ID
3. Register FIDO2 device
4. Create WebAuthn credential (browser prompts for TouchID/FaceID/security key)
5. Device activated and ready for authentication

### SMS Sample App

**Location:** `/samples/p1mfa/sms`

**Tabs:**
- **Credentials:** Initialize SDK
- **Registration:** Enroll SMS device
- **Authentication:** Authenticate with SMS OTP
- **Devices:** View and manage devices

**Flow:**
1. Initialize SDK with PingOne credentials
2. Enter User ID and phone number
3. Register SMS device
4. Send OTP (automatic)
5. Enter OTP code
6. Device activated and ready for authentication

---

## Prerequisites

### PingOne Configuration

1. **Environment Setup:**
   - PingOne environment with MFA enabled
   - Device Authentication Policy created
   - FIDO2 method enabled in policy
   - SMS provider configured

2. **Application Setup:**
   - OIDC application (for integrated sample)
   - Redirect URI: `https://localhost:3000/callback`
   - PKCE enabled (recommended)

3. **Worker Token:**
   - Client credentials for worker token
   - Client ID and Secret
   - Appropriate scopes/permissions

### Browser Requirements

- **FIDO2:** Modern browser with WebAuthn support
  - Chrome 67+, Firefox 60+, Safari 13+, Edge 18+
  - HTTPS or localhost (required for WebAuthn)
- **SMS:** Any modern browser

---

## Common Workflows

### Workflow 1: Complete SMS Enrollment and Authentication

1. Go to `/samples/p1mfa/sms`
2. **Credentials tab:** Initialize SDK
3. **Registration tab:**
   - Enter User ID
   - Enter phone number (+1234567890)
   - Click "Register SMS Device"
   - Enter OTP code from SMS
   - Click "Activate Device"
4. **Authentication tab:**
   - Enter User ID and Policy ID
   - Click "Initialize SMS Authentication"
   - Enter OTP code
   - Click "Complete Authentication"

### Workflow 2: Complete FIDO2 Enrollment and Authentication

1. Go to `/samples/p1mfa/fido2`
2. **Credentials tab:** Initialize SDK
3. **Registration tab:**
   - Enter User ID and Policy ID
   - Click "Register FIDO2 Device"
   - Click "Create WebAuthn Credential"
   - Browser prompts for biometric/security key
   - Device activated
4. **Authentication tab:**
   - Enter User ID and Policy ID
   - Click "Initialize FIDO2 Authentication"
   - Click "Get WebAuthn Assertion"
   - Browser prompts for biometric/security key
   - Authentication completed

### Workflow 3: Integrated OIDC + MFA Flow

1. Go to `/samples/p1mfa/integrated`
2. **Environment Config tab:**
   - Initialize SDK
   - Enter OIDC Client ID
   - Enter Device Authentication Policy ID
3. **OIDC Sign-in tab:**
   - Click "Start OIDC Sign-in"
   - Complete authentication
   - User ID extracted automatically
4. **Enroll SMS/FIDO2 tab:**
   - Enroll your preferred MFA method
5. **Authenticate tab:**
   - Test MFA authentication
   - Verify step-up flow works

---

## Troubleshooting

### "SDK not initialized" Error
- **Solution:** Go to Credentials tab and initialize SDK first

### "WebAuthn not supported" Error
- **Solution:** Use a modern browser (Chrome, Firefox, Safari, Edge)
- Ensure you're on HTTPS or localhost

### "OTP not received" Error
- **Solution:** 
  - Check SMS provider configuration in PingOne
  - Verify phone number format (+1234567890)
  - Check spam folder for SMS

### "Device activation failed" Error
- **Solution:**
  - Verify OTP code is correct
  - Check device is in ACTIVATION_REQUIRED state
  - Ensure policy ID is correct

### "Authentication failed" Error
- **Solution:**
  - Verify user has enrolled device
  - Check device is ACTIVE status
  - Ensure policy ID matches enrollment policy

---

## API Reference

See `docs/P1MFA_SDK_IMPLEMENTATION_PLAN.md` for complete API reference and implementation details.

---

## Next Steps

1. **Explore the SDK:** Check out `src/sdk/p1mfa/` for the SDK implementation
2. **Review Samples:** Study the sample apps in `src/samples/p1mfa/`
3. **Integrate:** Use the SDK in your own applications
4. **Extend:** Add support for other MFA methods (TOTP, Email, etc.)

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0
