# P1MFA SDK - Security & Operational Guardrails

**Version:** 1.0.0  
**Status:** Implementation Guide

This document outlines security best practices and operational guardrails for the P1MFA SDK sample applications.

---

## Security Principles

### 1. Never Expose Admin/Service Tokens to Browser

**Implementation:**
- ✅ All SDK methods use backend proxy endpoints (`/api/pingone/mfa/*`)
- ✅ Worker tokens are sent to backend via POST body (not exposed in URL or headers)
- ✅ Backend handles all PingOne API authentication
- ✅ Frontend never stores or displays worker tokens

**Code Pattern:**
```typescript
// ✅ CORRECT: Use backend proxy
const response = await fetch('/api/pingone/mfa/register-device', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    environmentId,
    userId,
    workerToken: token, // Sent to backend, not exposed in browser
    // ... other params
  }),
});

// ❌ WRONG: Direct API call with token in header
const response = await fetch('https://api.pingone.com/...', {
  headers: {
    Authorization: `Bearer ${token}`, // Token exposed in browser!
  },
});
```

---

### 2. Store Secrets Only on Backend

**Implementation:**
- ✅ Client secrets stored in backend environment variables
- ✅ Worker token generation happens server-side
- ✅ Frontend only receives temporary access tokens (if needed)
- ✅ No secrets in localStorage, sessionStorage, or cookies

**Backend Configuration:**
```javascript
// server.js - Environment variables
const WORKER_CLIENT_ID = process.env.WORKER_CLIENT_ID;
const WORKER_CLIENT_SECRET = process.env.WORKER_CLIENT_SECRET;
```

---

### 3. Rate Limiting OTP Endpoints

**Implementation:**
- ✅ Backend implements rate limiting for OTP endpoints
- ✅ Client-side debouncing prevents rapid-fire requests
- ✅ User feedback for rate limit errors

**Backend Rate Limiting (Example):**
```javascript
// server.js - Rate limiting middleware
const rateLimit = require('express-rate-limit');

const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many OTP requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/pingone/mfa/send-otp', otpRateLimiter, async (req, res) => {
  // ... handler
});
```

**Client-Side Debouncing:**
```typescript
// Prevent rapid-fire clicks
const [sending, setSending] = useState(false);

const handleSendOTP = async () => {
  if (sending) return; // Already sending
  setSending(true);
  try {
    await sendOTP();
  } finally {
    setTimeout(() => setSending(false), 2000); // 2 second cooldown
  }
};
```

---

### 4. WebAuthn RP ID / Origin Handling

**Implementation:**
- ✅ RP ID automatically set based on `window.location.hostname`
- ✅ Localhost handling: `localhost` for development
- ✅ Production: actual domain hostname
- ✅ HTTPS required in non-local environments

**Code:**
```typescript
// src/sdk/p1mfa/fido2.ts
static async registerFIDO2Device(sdk: P1MFASDK, params: DeviceRegistrationParams) {
  if (!params.rp) {
    const hostname = typeof window !== 'undefined' 
      ? window.location.hostname 
      : 'localhost';
    
    params.rp = {
      id: hostname === 'localhost' ? 'localhost' : hostname,
      name: hostname === 'localhost' ? 'Local Development' : hostname,
    };
  }
  return sdk.registerDevice(params);
}
```

**PingOne Configuration:**
- FIDO2 Policy must allow the RP ID
- For localhost: Add `localhost` to allowed RP IDs
- For production: Add your domain to allowed RP IDs

---

### 5. HTTPS in Non-Local Environments

**Implementation:**
- ✅ WebAuthn requires HTTPS (or localhost)
- ✅ Development: `http://localhost:3000` works
- ✅ Production: Must use HTTPS

**Browser Check:**
```typescript
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  throw new Error('WebAuthn requires HTTPS in production environments');
}
```

---

## Operational Guardrails

### 1. Error Handling

**Implementation:**
- ✅ All SDK methods throw typed errors (`P1MFAError`)
- ✅ User-friendly error messages
- ✅ Detailed error logging for debugging
- ✅ No sensitive data in error messages

**Example:**
```typescript
try {
  await sdk.registerDevice(params);
} catch (error) {
  if (error instanceof P1MFAError) {
    // User-friendly message
    setError(error.message);
    // Detailed logging (no sensitive data)
    console.error('Device registration failed:', {
      code: error.code,
      status: error.status,
      // No tokens or secrets logged
    });
  }
}
```

---

### 2. Input Validation

**Implementation:**
- ✅ Validate all user inputs
- ✅ Sanitize phone numbers, emails
- ✅ Validate OTP format (6-10 digits)
- ✅ Validate device IDs, user IDs

**Example:**
```typescript
const validatePhoneNumber = (phone: string): boolean => {
  // E.164 format: +1234567890
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

const validateOTP = (otp: string): boolean => {
  // 6-10 digits
  return /^\d{6,10}$/.test(otp);
};
```

---

### 3. State Management

**Implementation:**
- ✅ Clear state machine status tracking
- ✅ Prevent duplicate operations
- ✅ Reset state on errors
- ✅ Loading states for all async operations

**Example:**
```typescript
type RegistrationState = 
  | 'idle'
  | 'creating'
  | 'webauthn_pending'
  | 'activating'
  | 'success'
  | 'error';

const [state, setState] = useState<RegistrationState>('idle');
```

---

### 4. Debug Panel Security

**Implementation:**
- ✅ Sanitize sensitive data in debug panel
- ✅ Redact tokens, secrets, OTPs
- ✅ Only show in development mode (optional)
- ✅ Never log sensitive data to console

**Code:**
```typescript
const sanitizeBody = (body: unknown): unknown => {
  const sensitiveKeys = [
    'token', 'secret', 'password', 'otp',
    'client_secret', 'access_token', 'refresh_token'
  ];
  
  const sanitized = { ...body };
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
};
```

---

## Checklist

### Security Checklist

- [x] All API calls use backend proxy endpoints
- [x] Worker tokens never exposed in browser
- [x] Client secrets stored only on backend
- [x] Rate limiting implemented for OTP endpoints
- [x] WebAuthn RP ID correctly configured
- [x] HTTPS enforced in production
- [x] Sensitive data sanitized in debug panel
- [x] Input validation on all user inputs
- [x] Error messages don't expose sensitive data

### Operational Checklist

- [x] State machine status tracking
- [x] Correlation ID tracking
- [x] Comprehensive error handling
- [x] Loading states for all operations
- [x] User-friendly error messages
- [x] Debug panel with sanitized data
- [x] Copy buttons for non-sensitive data
- [x] Clear separation between enrollment and authentication

---

## Testing Security

### Manual Testing

1. **Token Exposure:**
   - Open browser DevTools → Network tab
   - Perform MFA operation
   - Verify no tokens in request headers or URLs
   - Verify tokens only in POST body to backend

2. **Rate Limiting:**
   - Rapidly click "Send OTP" button
   - Verify rate limit error after 5 attempts
   - Verify cooldown period enforced

3. **WebAuthn RP ID:**
   - Test on localhost (should use `localhost`)
   - Test on production domain (should use domain)
   - Verify PingOne policy allows the RP ID

4. **HTTPS:**
   - Test on localhost (http:// should work)
   - Test on production (https:// required)
   - Verify WebAuthn works in both cases

---

## References

- **PingOne MFA API Docs:** https://apidocs.pingidentity.com/pingone/mfa/v1/api/
- **WebAuthn Spec:** https://www.w3.org/TR/webauthn-2/
- **OAuth 2.0 Security Best Practices:** https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0
