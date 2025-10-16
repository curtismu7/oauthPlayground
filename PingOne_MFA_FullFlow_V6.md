# PingOne MFA Combined Flow — SDK/API Full Tutorial

**Version:** 3.0.0  
**Mode Switch:** SDK | API  
**Stepper:** ["Create User", "Username/Email", "Password", "Enroll MFA", "Pair Device", "MFA Challenge", "Tokens", "Success"]  
**Services:** V6  
**Auth Flow:** OIDC (PKCE)  
**MFA Types:** TOTP, Push, FIDO2, SMS, Email, Voice  
**Tokens:** access_token, id_token, refresh_token  

---

## Overview
This document describes the complete end-to-end user flow for PingOne MFA registration and authentication, supporting both SDK and API implementations.  
It is meant as an educational and executable reference, showing actual API endpoints, JSON request/response samples, and full token lifecycle management.

---

### Step Flow Overview
1. Create User
2. Username/Email Login
3. Password Authentication (PKCE)
4. MFA Enrollment (if no device)
5. Device Pairing (TOTP, FIDO2, Push, SMS/Email)
6. MFA Challenge Verification
7. Token Retrieval (access, ID, refresh)
8. Success & Session Establishment

---

## Code Reference (V6 Services)

```ts
class AuthServiceV6 {
  login(identifier: string): Promise<{authUrl, flowId}> { … }
  exchangeToken(code: string, verifier: string): Promise<Tokens> { … }
  refreshToken(refreshToken: string): Promise<Tokens> { … }
}

class UserServiceV6 {
  createUser(payload): Promise<User> { … }
  listDevices(userId): Promise<Device[]> { … }
}

class MFAServiceV6 {
  createDevice(userId, type): Promise<Device> { … }
  verifyDevice(userId, deviceId, code): Promise<Device> { … }
  initiateDeviceAuth(userId, deviceId): Promise<DeviceAuthTxn> { … }
  completeDeviceAuth(txnId, data): Promise<{status: string}> { … }
}
```

---

## Token Reference

| Token | Description | Example |
|--------|--------------|----------|
| **Access Token** | Used for API calls | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **ID Token** | Contains user claims | `eyJraWQiOiJrMTIzIn0.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoiYWxleC5zbWl0aEBleGFtcGxlLmNvbSJ9...` |
| **Refresh Token** | Used to renew access tokens | `def50200a1bcd...` |

---

## Security / UX Notes

- Always use **PKCE + state** for browser-based OIDC flows.
- Never log sensitive fields like `secret` or `otp`.
- Use non-blocking logging with tags: `[🔑 AUTH]`, `[🔐 MFA]`, `[🚦 STEPPER]`.
- Support fallback MFA methods.
- Show clear progress and results in **V5stepper**.

---

## Expected Outcome

✅ Full support for PingOne MFA via both SDK and API.  
✅ Complete education on endpoints, tokens, and step sequencing.  
✅ Seamless UX with token visibility and fallback security controls.
