# PingOne MFA Postman Collection - Complete Example

## Files

- **Collection:** `pingone-mfa-complete-collection.json`
- **Environment:** `pingone-mfa-environment-example.json`
- **Import Instructions:** `MFA_IMPORT_INSTRUCTIONS.md`

## Collection Structure

### 1. Get Worker Token
- **Get Worker Token (Client Credentials)**
  - Extracts: `workerToken` ✅
  - Required for Admin Flow and Registration/Authentication flows

### 2. Admin Flow - SMS
- **1. Get Worker Token (Client Credentials)**
  - Extracts: `workerToken` ✅
- **2. Get User ID**
  - Extracts: `userId` ✅
- **3. Create SMS Device (ACTIVE)**
  - Extracts: `deviceId` ✅
  - Status: `ACTIVE` (immediately usable, no OTP required)

### 3. User Flow - SMS
- **1. Get Authorization Code (OAuth Login)**
  - Manual step: Copy URL and open in browser
- **2. Exchange Authorization Code for Access Token**
  - Extracts: `userToken` ✅
- **3. Get User ID (using User Token)**
  - Extracts: `userId` ✅
- **4. Create SMS Device (ACTIVATION_REQUIRED)**
  - Extracts: `deviceId` ✅
  - Status: `ACTIVATION_REQUIRED` (always, enforced)
- **5. Activate SMS Device (with OTP)**
  - Uses OTP code received via SMS

### 4. Registration (6 device types)
Each device type has 3 requests:
- **1. Get User ID** → Extracts `userId` ✅
- **2. Create [Device] Device** → Extracts `deviceId` ✅
- **3. Activate [Device] Device** → Uses saved `userId` and `deviceId`

Device Types: SMS, Email, WhatsApp, TOTP, FIDO2, Mobile

### 5. Authentication (6 device types)
Each device type has 3-4 requests:
- **1. Initialize Device Authentication** → Extracts `deviceAuthenticationId` ✅
- **2. Check OTP** (or Select Device for FIDO2) → Uses saved `deviceAuthenticationId`
- **3. Check Assertion** (FIDO2 only)
- **4. Complete Authentication** → Uses saved `deviceAuthenticationId`

## Environment Variables

### Required (Set These First)
- `authPath`: `https://auth.pingone.com`
- `apiPath`: `https://api.pingone.com`
- `envID`: Your PingOne Environment ID
- `client_id`: Your OAuth Client ID
- `client_secret`: Your OAuth Client Secret
- `username`: Username for MFA operations
- `deviceAuthenticationPolicyId`: Your MFA policy ID
- `redirect_uri`: OAuth redirect URI (for User Flow)

### Auto-Extracted (Scripts Fill These)
- `workerToken`: From "Get Worker Token" request ✅
- `userToken`: From "Exchange Authorization Code" request ✅
- `userId`: From "Get User ID" requests ✅
- `deviceId`: From "Create Device" requests ✅
- `deviceAuthenticationId`: From "Initialize Device Authentication" requests ✅

### Optional (Set As Needed)
- `phone`: Phone number for SMS/WhatsApp/Mobile
- `email`: Email address for Email device
- `deviceName`: Device nickname
- `otp_code`: OTP code (from SMS/Email/WhatsApp/TOTP app)
- `authorization_code`: Authorization code from OAuth callback (User Flow)
- `state`: OAuth state parameter
- `nonce`: OAuth nonce parameter
- FIDO2 variables: `credentialId`, `rawId`, `clientDataJSON`, `authenticatorData`, `signature`, `userHandle`

## Quick Start: Admin Flow (ACTIVE)

1. **Set Variables:**
   - `envID`: `your-env-id`
   - `client_id`: `your-client-id`
   - `client_secret`: `your-client-secret`
   - `username`: `user@example.com`
   - `phone`: `+1234567890`
   - `deviceName`: `My SMS Device`
   - `deviceAuthenticationPolicyId`: `your-policy-id`

2. **Run Admin Flow:**
   - Run: "Admin Flow - SMS > 1. Get Worker Token"
   - ✅ `workerToken` auto-saved
   - Run: "Admin Flow - SMS > 2. Get User ID"
   - ✅ `userId` auto-saved
   - Run: "Admin Flow - SMS > 3. Create SMS Device (ACTIVE)"
   - ✅ `deviceId` auto-saved
   - ✅ Device is ACTIVE - ready to use immediately!

## Quick Start: User Flow (ACTIVATION_REQUIRED)

1. **Set Variables:**
   - Same as Admin Flow, plus:
   - `redirect_uri`: `http://localhost:3000/authz-callback`

2. **Run User Flow:**
   - Copy URL from "User Flow - SMS > 1. Get Authorization Code"
   - Open in browser and complete login
   - Extract `code` from callback URL → Set `authorization_code` variable
   - Run: "User Flow - SMS > 2. Exchange Authorization Code for Access Token"
   - ✅ `userToken` auto-saved
   - Run: "User Flow - SMS > 3. Get User ID"
   - ✅ `userId` auto-saved
   - Run: "User Flow - SMS > 4. Create SMS Device (ACTIVATION_REQUIRED)"
   - ✅ `deviceId` auto-saved
   - Check SMS for OTP → Set `otp_code` manually
   - Run: "User Flow - SMS > 5. Activate SMS Device"

## Key Features

✅ **Automatic Variable Extraction:** All IDs and tokens are automatically saved
✅ **Two Flow Types:** Admin Flow (ACTIVE) and User Flow (ACTIVATION_REQUIRED)
✅ **Complete Coverage:** All 6 device types (SMS, Email, WhatsApp, TOTP, FIDO2, Mobile)
✅ **Correct API Format:** Uses `{{apiPath}}/environments/{{envID}}/` for Platform API
✅ **Status Field:** All request bodies include `status` field
✅ **Policy Support:** All device creation includes policy ID

## Differences: Admin vs User Flow

| Feature | Admin Flow | User Flow |
|---------|-----------|-----------|
| Token | Worker Token | User Token (OAuth) |
| Login Required | No | Yes (PingOne OAuth) |
| Device Status | ACTIVE | ACTIVATION_REQUIRED |
| OTP Required | No | Yes |
| Use Case | Admin provisioning | User self-service |
