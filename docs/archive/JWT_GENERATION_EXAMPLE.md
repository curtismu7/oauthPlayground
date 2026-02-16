# JWT Client Authentication - Practical Example

## How the Unified Flow Generates JWT for PingOne

This shows exactly how the unified flow acts as an OAuth client and generates JWT assertions for PingOne authentication.

## Complete Flow: Client Secret JWT

### Step 1: User Interface Selection

```
User selects: "Client Secret JWT" from dropdown
UI shows: Client ID and Client Secret fields
```

### Step 2: Credential Collection

```typescript
// User enters these credentials:
const credentials = {
  clientId: "my-oauth-client-12345",
  clientSecret: "super-secret-client-key-abc123",
  environmentId: "us-west-2-env-67890"
};
```

### Step 3: JWT Generation (Behind the scenes)

```typescript
// This happens automatically in createClientAssertion()
const tokenEndpoint = "https://auth.pingone.com/us-west-2-env-67890/as/token";
const now = Math.floor(Date.now() / 1000); // 1700912345

// JWT Claims
const claims = {
  iss: "my-oauth-client-12345",  // Issuer = client ID
  sub: "my-oauth-client-12345",  // Subject = client ID
  aud: "https://auth.pingone.com/us-west-2-env-67890/as/token", // Audience
  iat: 1700912345,               // Issued at
  nbf: 1700912345,               // Not before
  exp: 1700912645,               // Expires in 5 minutes
  jti: "abc123def456ghi789"      // Random JWT ID
};

// JWT Header
const header = {
  alg: "HS256",
  typ: "JWT"
};

// Sign with client secret (HMAC-SHA256)
const jwt = await new SignJWT(claims)
  .setProtectedHeader(header)
  .sign(new TextEncoder().encode("super-secret-client-key-abc123"));

// Result: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJzdWIiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJhdWQiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vdXMtd2VzdC0yLWVudi02Nzg5MC9hcy90b2tlbiIsImlhdCI6MTcwMDkxMjM0NSwibmJmIjoxNzAwOTEyMzQ1LCJleHAiOjE3MDA5MTI2NDUsImp0aSI6ImFiYzEyM2RlZjQ1NmdoaTc4OSJ9.signature
```

### Step 4: Send to PingOne

```typescript
// The unified flow sends this to PingOne:
const tokenRequest = {
  method: 'POST',
  url: 'https://auth.pingone.com/us-west-2-env-67890/as/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJzdWIiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJhdWQiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vdXMtd2VzdC0yLWVudi02Nzg5MC9hcy90b2tlbiIsImlhdCI6MTcwMDkxMjM0NSwibmJmIjoxNzAwOTEyMzQ1LCJleHAiOjE3MDA5MTI2NDUsImp0aSI6ImFiYzEyM2RlZjQ1NmdoaTc4OSJ9.signature',
    scope: 'openid profile'
  })
};
```

### Step 5: PingOne Validation

PingOne validates:
1. JWT signature using the registered client secret
2. Claims (iss, sub, aud, exp, etc.)
3. Token endpoint URL matches audience

### Step 6: Token Response

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile"
}
```

## Complete Flow: Private Key JWT

### Step 1: User Interface Selection

```
User selects: "Private Key JWT" from dropdown
UI shows: Client ID and Private Key fields (larger textarea)
```

### Step 2: Credential Collection

```typescript
// User enters these credentials:
const credentials = {
  clientId: "my-oauth-client-12345",
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
xhXctbdgZcfwxh6W68d2TIT9nBvQCL/lqkH2tTN1oO5Hj5FLjMkVCq6rO0JvJ3lJ
QY8UWGTJ2QjVqYP1zD5vX8f9A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1
U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3
A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5
G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7
M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9
S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1
Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3
E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5
K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7
Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9
W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1
C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3
I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5
O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7
U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9
A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1
G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3
M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5
S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7
Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9
E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2
L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4
R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7
Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0
F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3
M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5
S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7
Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3
E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5
K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7
Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9
W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1
C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3
I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5
O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7
U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9
A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1
G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3
M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5
S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7
Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9
E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1
K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3
Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5
W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7
C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9
I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1
O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3
U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5
A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7
G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9
M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1
S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3
Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9
E0F1G2H3I4J5K6L7M8N9O0P1Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5
K6L7M8N9O0P1Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q
-----END PRIVATE KEY-----`,
  environmentId: "us-west-2-env-67890"
};
```

### Step 3: JWT Generation (Behind the scenes)

```typescript
// This happens automatically in createClientAssertion()
const tokenEndpoint = "https://auth.pingone.com/us-west-2-env-67890/as/token";
const now = Math.floor(Date.now() / 1000); // 1700912345

// JWT Claims (same as before)
const claims = {
  iss: "my-oauth-client-12345",
  sub: "my-oauth-client-12345", 
  aud: "https://auth.pingone.com/us-west-2-env-67890/as/token",
  iat: 1700912345,
  nbf: 1700912345,
  exp: 1700912645,
  jti: "xyz789abc456def123"
};

// JWT Header
const header = {
  alg: "RS256",
  typ: "JWT"
};

// Import PKCS#8 private key and sign with RSA-SHA256
const privateKey = await importPKCS8(credentials.privateKey, 'RS256');
const jwt = await new SignJWT(claims)
  .setProtectedHeader(header)
  .sign(privateKey);

// Result: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJzdWIiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJhdWQiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vdXMtd2VzdC0yLWVudi02Nzg5MC9hcy90b2tlbiIsImlhdCI6MTcwMDkxMjM0NSwibmJmIjoxNzAwOTEyMzQ1LCJleHAiOjE3MDA5MTI2NDUsImp0aSI6Inh5ejc4OWFiYzQ1NmRlZjEyMyJ9.signature
```

### Step 4: Send to PingOne (Same as Client Secret JWT)

```typescript
// The unified flow sends this to PingOne:
const tokenRequest = {
  method: 'POST',
  url: 'https://auth.pingone.com/us-west-2-env-67890/as/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJzdWIiOiJteS1vYXV0aC1jbGllbnQtMTIzNDUiLCJhdWQiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vdXMtd2VzdC0yLWVudi02Nzg5MC9hcy90b2tlbiIsImlhdCI6MTcwMDkxMjM0NSwibmJmIjoxNzAwOTEyMzQ1LCJleHAiOjE3MDA5MTI2NDUsImp0aSI6Inh5ejc4OWFiYzQ1NmRlZjEyMyJ9.signature',
    scope: 'openid profile'
  })
};
```

## Key Differences Between the Two Methods

| Aspect | Client Secret JWT | Private Key JWT |
|--------|------------------|-----------------|
| **Algorithm** | HS256 (HMAC-SHA256) | RS256 (RSA-SHA256) |
| **Key Type** | Symmetric (shared secret) | Asymmetric (public/private key pair) |
| **Security** | High | Highest |
| **Key Storage** | Store client secret securely | Store private key securely |
| **PingOne Setup** | Register client secret | Upload public key to PingOne |
| **Use Case** | Standard applications | Enterprise/high-security |

## Implementation in Unified Flow

The unified flow handles all this complexity automatically:

1. **UI Selection**: User chooses auth method from dropdown
2. **Credential Collection**: Appropriate fields appear
3. **JWT Generation**: `createClientAssertion()` handles everything
4. **API Integration**: Services add JWT to token requests
5. **Error Handling**: Clear error messages for issues

## Debug JWT Generation

You can see the generated JWT in the API display:

1. Enable "API Display" checkbox
2. Execute a token request
3. Look at the "Request Body" section
4. Copy the `client_assertion` value
5. Decode at https://jwt.io to verify claims

## Common Issues and Solutions

### "invalid_client" Error
- **Cause**: JWT signature verification failed
- **Solution**: 
  - For client_secret_jwt: Check client secret is correct
  - For private_key_jwt: Ensure public key is uploaded to PingOne

### "invalid_grant" Error  
- **Cause**: Token endpoint URL incorrect
- **Solution**: Verify environment ID is correct

### "expired_token" Error
- **Cause**: JWT expired (shouldn't happen with 5min expiry)
- **Solution**: Check system clock synchronization

### "key_not_found" Error
- **Cause**: Private key not registered in PingOne
- **Solution**: Upload the public key to PingOne application settings
