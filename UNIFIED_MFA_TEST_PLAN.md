# 🧪 Unified MFA Flow & API Testing Plan

## 📋 Test Overview

**Objective**: Comprehensive testing of Unified MFA flow and all API calls
**Scope**: All 8 device types and their respective API endpoints
**Environment**: Development server with real PingOne APIs

## 🎯 Device Types to Test

1. **SMS** - SMS OTP authentication
2. **EMAIL** - Email OTP authentication
3. **TOTP** - Time-based One-Time Password
4. **FIDO2** - WebAuthn/FIDO2 security keys
5. **MOBILE** - Mobile app push notifications
6. **OATH_TOKEN** - Hardware token devices
7. **VOICE** - Voice call OTP
8. **WHATSAPP** - WhatsApp OTP

## 🔗 API Endpoints to Test

### MFA Service V8 (Device Registration)

- `POST /environments/{envId}/users/{userId}/devices`
- `GET /environments/{envId}/users/{userId}/devices`
- `PUT /environments/{envId}/users/{userId}/devices/{deviceId}`
- `DELETE /environments/{envId}/users/{userId}/devices/{deviceId}`

### MFA Authentication Service V8 (Device Authentication)

- `POST /mfa/v1/environments/{envId}/deviceAuthentications`
- `POST /mfa/v1/environments/{envId}/deviceAuthentications/{id}/otp`
- `POST /mfa/v1/environments/{envId}/deviceAuthentications/{id}/challenges`
- `GET /mfa/v1/environments/{envId}/deviceAuthentications/{id}/status`

### Worker Token Service V8 (Authentication)

- `POST /environments/{envId}/as/token` (client_credentials grant)

## 🧪 Test Scenarios

### Phase 1: Basic Flow Testing

1. **Navigation Test**
   - Access `/v8/unified-mfa` route
   - Verify component loads without errors
   - Check all device type options are available

2. **Credentials Test**
   - Enter valid environment credentials
   - Verify worker token acquisition
   - Test credential persistence

### Phase 2: Device Registration Testing

For each device type:

1. **SMS Device Registration**
   - Enter phone number with country code
   - Submit registration request
   - Verify device creation response
   - Check device status (ACTIVE/ACTIVATION_REQUIRED)

2. **EMAIL Device Registration**
   - Enter email address
   - Submit registration request
   - Verify device creation response
   - Check device status

3. **TOTP Device Registration**
   - Generate TOTP secret
   - Display QR code for authenticator app
   - Verify device registration
   - Test TOTP code validation

4. **FIDO2 Device Registration**
   - Initiate WebAuthn ceremony
   - Test security key registration
   - Verify credential creation
   - Check device activation

### Phase 3: Device Authentication Testing

For each registered device:

1. **OTP Authentication**
   - Initiate authentication flow
   - Receive OTP (SMS/Email/Voice/WhatsApp)
   - Submit OTP for verification
   - Complete authentication

2. **Push Authentication**
   - Send push notification (Mobile)
   - Monitor authentication status
   - Complete flow

3. **WebAuthn Authentication**
   - Initiate FIDO2 authentication
   - Use security key/biometrics
   - Complete authentication

### Phase 4: Error Handling Testing

1. **Invalid Credentials**
   - Test with wrong environment ID
   - Test with invalid client credentials
   - Verify error handling

2. **Invalid Device Data**
   - Test with invalid phone numbers
   - Test with invalid email addresses
   - Test with missing required fields

3. **Network Errors**
   - Test API timeout handling
   - Test network failure scenarios
   - Verify retry mechanisms

### Phase 5: Edge Cases Testing

1. **Device Limits**
   - Test maximum device limits per user
   - Test duplicate device registration
   - Test device deletion and re-registration

2. **Policy Compliance**
   - Test with different authentication policies
   - Verify policy enforcement
   - Test policy violations

## 🔍 Test Execution Plan

### Step 1: Environment Setup

- [ ] Verify PingOne environment credentials
- [ ] Check worker token service availability
- [ ] Validate API endpoints accessibility

### Step 2: Basic Flow Testing

- [ ] Navigate to Unified MFA flow
- [ ] Test credential input and validation
- [ ] Verify worker token acquisition

### Step 3: Device Registration Testing

- [ ] SMS device registration
- [ ] EMAIL device registration
- [ ] TOTP device registration
- [ ] FIDO2 device registration
- [ ] MOBILE device registration
- [ ] OATH_TOKEN device registration
- [ ] VOICE device registration
- [ ] WHATSAPP device registration

### Step 4: Device Authentication Testing

- [ ] SMS OTP authentication
- [ ] EMAIL OTP authentication
- [ ] TOTP code authentication
- [ ] FIDO2 WebAuthn authentication
- [ ] MOBILE push authentication
- [ ] OATH_TOKEN code authentication
- [ ] VOICE call authentication
- [ ] WHATSAPP OTP authentication

### Step 5: Error Handling Testing

- [ ] Invalid credentials scenarios
- [ ] Invalid device data scenarios
- [ ] Network error scenarios
- [ ] Policy violation scenarios

## 📊 Test Results Tracking

### Test Status Matrix

| Device Type | Registration | Authentication | Error Handling | Status  |
| ----------- | ------------ | -------------- | -------------- | ------- |
| SMS         | ⏳           | ⏳             | ⏳             | Pending |
| EMAIL       | ⏳           | ⏳             | ⏳             | Pending |
| TOTP        | ⏳           | ⏳             | ⏳             | Pending |
| FIDO2       | ⏳           | ⏳             | ⏳             | Pending |
| MOBILE      | ⏳           | ⏳             | ⏳             | Pending |
| OATH_TOKEN  | ⏳           | ⏳             | ⏳             | Pending |
| VOICE       | ⏳           | ⏳             | ⏳             | Pending |
| WHATSAPP    | ⏳           | ⏳             | ⏳             | Pending |

### API Response Validation

- [ ] HTTP status codes
- [ ] Response format validation
- [ ] Error message verification
- [ ] Rate limiting detection

## 🚀 Execution Commands

### Start Development Server

```bash
npm run dev
```

### Access Unified MFA Flow

```
http://localhost:3000/v8/unified-mfa
```

### Monitor API Calls

- Check browser Network tab
- Review API call tracker service logs
- Monitor console for debugging information

## 📝 Test Notes

### Expected Behaviors

1. **Successful Registration**: Device should appear in user's device list
2. **Successful Authentication**: Should return authentication success response
3. **Error Handling**: Should display user-friendly error messages
4. **State Management**: Should maintain state across authentication flow

### Known Limitations

1. **Real Phone/Email**: Requires actual phone numbers/email addresses
2. **FIDO2**: Requires compatible security key or biometrics
3. **Mobile App**: Requires PingOne mobile app installation
4. **WhatsApp**: Requires WhatsApp integration setup

### Test Data Requirements

- Valid PingOne environment ID
- Valid client credentials (client ID/secret)
- Test user account with MFA enabled
- Access to phone/email for OTP testing
- Security key for FIDO2 testing

---

**Ready to execute comprehensive Unified MFA testing!** 🚀
