# Unified Flow - Response Mode Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** Developers, End Users  
**Flow Type:** All Unified OAuth/OIDC Flows

## Table of Contents

1. [Overview](#overview)
2. [Response Mode Types](#response-mode-types)
3. [How to Change Response Mode](#how-to-change-response-mode)
4. [Response Mode by Flow Type](#response-mode-by-flow-type)
5. [Redirectless (PingOne pi.flow)](#redirectless-pingone-piflow)
6. [Postman Collection Support](#postman-collection-support)
7. [Troubleshooting](#troubleshooting)

---

## Overview

**Response Mode** controls how PingOne returns authorization data (authorization code, tokens, etc.) to your application after the user authenticates. The OAuth Playground supports all standard OAuth 2.0/OIDC response modes plus PingOne's proprietary redirectless flow.

### Key Concepts

- **Response Mode** is set via the `response_mode` parameter in the authorization URL
- Different response modes are suitable for different application types
- **Redirectless (pi.flow)** uses a separate API call instead of browser redirects
- Response mode can be changed easily in the credentials form

---

## Response Mode Types

### 1. 🔗 Query String (`query`)

**Default for:** Authorization Code Flow

**How it works:**
- Authorization response parameters are encoded in the URL query string
- Example: `https://yourapp.com/callback?code=abc123&state=xyz789`

**Best for:**
- Traditional web applications with server-side handling
- Applications that can securely process query parameters on the server
- Most OAuth 2.0 implementations

**Security Notes:**
- ✅ Standard OAuth 2.0 response mode
- Parameters visible in server logs
- Requires secure server-side handling
- Most compatible with existing OAuth implementations

**Implementation:**
```http
GET /as/authorize?
  client_id=your_client_id&
  response_type=code&
  response_mode=query&
  redirect_uri=https://yourapp.com/callback&
  scope=openid profile email&
  state=xyz789
```

**Response:**
```
https://yourapp.com/callback?code=abc123&state=xyz789
```

---

### 2. 🧩 URL Fragment (`fragment`)

**Default for:** Implicit Flow, Hybrid Flow

**How it works:**
- Authorization response parameters are encoded in the URL fragment (after `#`)
- Example: `https://yourapp.com/callback#access_token=xyz&token_type=Bearer&expires_in=3600`

**Best for:**
- Single Page Applications (SPAs)
- Client-side applications
- Mobile applications
- Applications that handle tokens in JavaScript

**Security Notes:**
- ✅ Standard OAuth 2.0 response mode
- Parameters **not sent to server** (client-side only)
- Requires JavaScript to extract parameters
- Recommended for public clients and SPAs

**Implementation:**
```http
GET /as/authorize?
  client_id=your_client_id&
  response_type=token id_token&
  response_mode=fragment&
  redirect_uri=https://yourapp.com/callback&
  scope=openid profile email&
  state=xyz789
```

**Response:**
```
https://yourapp.com/callback#access_token=xyz&token_type=Bearer&expires_in=3600&id_token=eyJ...
```

**JavaScript Extraction:**
```javascript
// Extract fragment parameters
const fragment = window.location.hash.substring(1);
const params = new URLSearchParams(fragment);
const accessToken = params.get('access_token');
const idToken = params.get('id_token');
```

---

### 3. 📝 Form POST (`form_post`)

**How it works:**
- Authorization response parameters are sent via HTTP POST as form data
- Browser automatically submits a form to your callback URL
- No parameters in the URL

**Best for:**
- Applications requiring secure parameter transmission without URL exposure
- High-security applications
- Applications that want to avoid URL length limitations

**Security Notes:**
- ⚙️ Advanced option - requires server-side handling
- 🔒 Most secure - no data in URL at all
- Parameters sent in POST body, not URL
- Requires server-side form processing

**Implementation:**
```http
GET /as/authorize?
  client_id=your_client_id&
  response_type=code&
  response_mode=form_post&
  redirect_uri=https://yourapp.com/callback&
  scope=openid profile email&
  state=xyz789
```

**Response:**
PingOne returns an HTML page with an auto-submitting form:
```html
<html>
  <body onload="document.forms[0].submit()">
    <form method="POST" action="https://yourapp.com/callback">
      <input type="hidden" name="code" value="abc123" />
      <input type="hidden" name="state" value="xyz789" />
    </form>
  </body>
</html>
```

**Server-Side Handling:**
```javascript
// Express.js example
app.post('/callback', (req, res) => {
  const code = req.body.code;
  const state = req.body.state;
  // Exchange code for tokens...
});
```

---

### 4. ⚡ Redirectless (PingOne) (`pi.flow`)

**How it works:**
- **No browser redirect** - uses a separate API call instead
- Returns a flow object via POST request
- Application controls the entire authentication UI
- Perfect for embedded authentication

**Best for:**
- Companies who want to control the UI themselves
- Embedded authentication
- Mobile applications
- Headless applications
- IoT devices
- Applications that need full control over the authentication user experience

**Security Notes:**
- 🔒 No redirect - returns flow object via POST
- 🎨 Full UI control - you design the authentication experience
- ✅ Perfect for embedded auth, mobile apps, and headless flows

**Implementation:**
Redirectless uses a **separate API endpoint** instead of the standard authorization URL:

```http
POST /api/pingone/redirectless/authorize
Content-Type: application/json

{
  "environmentId": "your-env-id",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "urn:pingidentity:redirectless",
  "scopes": "openid profile email",
  "codeChallenge": "generated-challenge",
  "codeChallengeMethod": "S256",
  "state": "xyz789"
}
```

**Response:**
```json
{
  "id": "flow-id-123",
  "status": "USERNAME_PASSWORD_REQUIRED",
  "resumeUrl": "https://auth.pingone.com/env-id/flows/flow-id-123/resume",
  "_sessionId": "session-id-456"
}
```

**Flow States:**
- `USERNAME_PASSWORD_REQUIRED` - User needs to enter credentials
- `MFA_REQUIRED` - User needs to complete MFA
- `COMPLETE` - Authentication complete, authorization code available

**Resuming the Flow:**
```http
POST /api/pingone/redirectless/resume
Content-Type: application/json

{
  "flowId": "flow-id-123",
  "sessionId": "session-id-456",
  "username": "user@example.com",
  "password": "user-password"
}
```

**Complete Flow:**
1. Start redirectless flow → Get flow object with `USERNAME_PASSWORD_REQUIRED`
2. User enters credentials → POST to resume endpoint
3. If MFA required → Get flow object with `MFA_REQUIRED`
4. User completes MFA → POST to resume endpoint
5. Flow complete → Get authorization code in response

---

## How to Change Response Mode

### In the OAuth Playground UI

1. **Navigate to Unified Flow Hub**
   - Go to the Unified Flow page
   - Select your flow type (Authorization Code, Implicit, Hybrid)

2. **Open Credentials Form**
   - Click on "Configure Credentials" or go to Step 0
   - Find the **"Response Mode"** dropdown

3. **Select Response Mode**
   - Click the dropdown to see available modes
   - Select your desired mode:
     - 🔗 Query String (Recommended for Authorization Code)
     - 🧩 URL Fragment (Recommended for Implicit/Hybrid)
     - 📝 Form POST
     - ⚡ Redirectless (PingOne)

4. **View Educational Information**
   - Click **"What is this?"** button next to Response Mode
   - Expandable panel shows:
     - Detailed explanation of each mode
     - Use cases and best practices
     - Visual examples
     - Security notes

5. **Mode Changes Automatically**
   - Response mode is saved with your credentials
   - Authorization URL updates automatically
   - For redirectless, the flow switches to POST API call mode

### Programmatically

```typescript
// Set response mode in credentials
const credentials = {
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  responseMode: 'query', // or 'fragment', 'form_post', 'pi.flow'
  // ... other credentials
};
```

---

## Response Mode by Flow Type

### Authorization Code Flow (OAuth 2.0/2.1/OIDC)

**Available Modes:**
- ✅ `query` (default/recommended) - Standard OAuth 2.0
- ✅ `fragment` - Alternative for SPAs
- ✅ `form_post` - Enhanced security
- ✅ `pi.flow` - PingOne redirectless

**Recommended:** `query` for traditional web apps, `pi.flow` for embedded/mobile

---

### Implicit Flow (OAuth 2.0/OIDC)

**Available Modes:**
- ✅ `fragment` (default/recommended) - Standard for implicit
- ✅ `form_post` - Alternative for security

**Note:** `query` and `pi.flow` are not available for implicit flow

**Recommended:** `fragment` (required by OAuth 2.0 spec for implicit flow)

---

### Hybrid Flow (OIDC)

**Available Modes:**
- ✅ `fragment` (default/recommended) - Standard for hybrid
- ✅ `query` - Alternative
- ✅ `form_post` - Enhanced security

**Note:** `pi.flow` is not available for hybrid flow

**Recommended:** `fragment`

---

### Client Credentials Flow

**Response Mode:** Not applicable
- Direct token endpoint call (no authorization step)
- No redirect or response mode needed

---

### Device Code Flow

**Response Mode:** Not applicable
- Uses device code polling
- No redirect or response mode needed

---

## Redirectless (PingOne pi.flow)

### Overview

Redirectless authentication is PingOne's proprietary flow that eliminates browser redirects. Instead of redirecting the user to PingOne's login page, your application makes API calls to control the authentication experience.

### Key Differences from Standard OAuth

| Standard OAuth | Redirectless (pi.flow) |
|----------------|------------------------|
| Browser redirects to PingOne | No redirect - API calls only |
| User sees PingOne UI | You control the UI |
| Authorization code in redirect URL | Authorization code in API response |
| GET request to `/as/authorize` | POST request to `/api/pingone/redirectless/authorize` |
| Single-step authorization | Multi-step flow with resume |

### When to Use Redirectless

✅ **Use redirectless when:**
- You want to control the authentication UI
- Building embedded authentication
- Mobile applications
- Headless applications
- IoT devices
- Custom authentication flows

❌ **Don't use redirectless when:**
- Standard OAuth redirect flow works for you
- You want to use PingOne's default UI
- Simple web applications

### Redirectless Flow Steps

1. **Start Redirectless Flow**
   ```http
   POST /api/pingone/redirectless/authorize
   {
     "environmentId": "...",
     "clientId": "...",
     "scopes": "openid profile email",
     "codeChallenge": "...",
     "codeChallengeMethod": "S256"
   }
   ```

2. **Receive Flow Object**
   ```json
   {
     "id": "flow-123",
     "status": "USERNAME_PASSWORD_REQUIRED",
     "resumeUrl": "https://auth.pingone.com/.../resume"
   }
   ```

3. **User Enters Credentials** (Your UI)

4. **Resume Flow**
   ```http
   POST /api/pingone/redirectless/resume
   {
     "flowId": "flow-123",
     "username": "user@example.com",
     "password": "password123"
   }
   ```

5. **Handle Flow States**
   - If `MFA_REQUIRED` → Show MFA UI, resume again
   - If `COMPLETE` → Extract authorization code

6. **Exchange Code for Tokens** (Standard token exchange)

### Redirectless in OAuth Playground

When you select **"Redirectless (PingOne)"** as the response mode:

1. **Authorization URL is Generated** (for display/reference)
2. **"Start Redirectless Authentication" Button Appears**
3. **Click Button** → Makes POST request to `/api/pingone/redirectless/authorize`
4. **Login Modal Appears** → User enters credentials
5. **Flow Resumes Automatically** → Handles MFA if needed
6. **Authorization Code Received** → Proceeds to token exchange

### Redirectless API Endpoints

#### Start Redirectless Flow
```http
POST /api/pingone/redirectless/authorize
Content-Type: application/json

{
  "environmentId": "string (required)",
  "clientId": "string (required)",
  "clientSecret": "string (optional, for confidential clients)",
  "redirectUri": "string (required, use 'urn:pingidentity:redirectless')",
  "scopes": "string (required)",
  "codeChallenge": "string (required for PKCE)",
  "codeChallengeMethod": "string (required, 'S256')",
  "state": "string (required)"
}
```

**Response:**
```json
{
  "id": "flow-id",
  "status": "USERNAME_PASSWORD_REQUIRED" | "MFA_REQUIRED" | "COMPLETE",
  "resumeUrl": "https://auth.pingone.com/.../resume",
  "_sessionId": "session-id"
}
```

#### Resume Redirectless Flow
```http
POST /api/pingone/redirectless/resume
Content-Type: application/json

{
  "flowId": "string (required)",
  "sessionId": "string (required)",
  "username": "string (required for USERNAME_PASSWORD_REQUIRED)",
  "password": "string (required for USERNAME_PASSWORD_REQUIRED)",
  "otpCode": "string (required for MFA_REQUIRED)"
}
```

**Response:**
```json
{
  "id": "flow-id",
  "status": "MFA_REQUIRED" | "COMPLETE",
  "resumeUrl": "https://auth.pingone.com/.../resume",
  "_sessionId": "session-id",
  "code": "authorization-code (when status is COMPLETE)"
}
```

---

## Postman Collection Support

The Postman collections generated by OAuth Playground include:

### Standard Response Modes

All Authorization Code flows include variations for:
- Query String (`response_mode=query`)
- URL Fragment (`response_mode=fragment`)
- Form POST (`response_mode=form_post`)

### Redirectless API Calls

The Postman collection includes a separate group for **Redirectless (PingOne)** flows:

1. **Start Redirectless Flow**
   - POST `/api/pingone/redirectless/authorize`
   - Includes all required parameters
   - Extracts `flowId` and `resumeUrl` from response

2. **Resume Redirectless Flow**
   - POST `/api/pingone/redirectless/resume`
   - Handles `USERNAME_PASSWORD_REQUIRED` state
   - Handles `MFA_REQUIRED` state
   - Extracts authorization code when `COMPLETE`

3. **Exchange Authorization Code for Tokens**
   - Standard token exchange (same as regular flow)

### Download Postman Collection

1. Go to any Unified flow
2. Click **"📚 Docs"** button in navigation
3. Click **"Download Postman Collection"**
4. Import both files:
   - `pingone-unified-flows-*-collection.json`
   - `pingone-unified-flows-*-environment.json`

The collection includes:
- All response mode variations
- Redirectless API calls
- Variable extraction scripts
- Educational comments

---

## Troubleshooting

### Response Mode Not Changing

**Problem:** Response mode dropdown doesn't update the authorization URL

**Solution:**
1. Ensure you've saved credentials (click "Save Credentials")
2. Refresh the authorization URL (click "Build Authorization URL")
3. Check browser console for errors

### Redirectless Not Working

**Problem:** Redirectless flow doesn't start or fails

**Solutions:**
1. **PKCE Required:** Ensure PKCE codes are generated (click "Generate PKCE Codes")
2. **Check API Endpoint:** Verify `/api/pingone/redirectless/authorize` is accessible
3. **Check Credentials:** Ensure `clientId`, `environmentId`, and `scopes` are set
4. **Check Redirect URI:** Use `urn:pingidentity:redirectless` for redirectless flows

### Form POST Not Working

**Problem:** Form POST response not received

**Solutions:**
1. **Server-Side Handler:** Ensure your callback URL has a POST endpoint
2. **Content-Type:** Server should accept `application/x-www-form-urlencoded`
3. **CORS:** If testing locally, ensure CORS is configured

### Fragment Parameters Not Extracted

**Problem:** Can't extract tokens from URL fragment

**Solutions:**
1. **JavaScript Required:** Fragment parameters are only accessible via JavaScript
2. **Use URLSearchParams:** 
   ```javascript
   const fragment = window.location.hash.substring(1);
   const params = new URLSearchParams(fragment);
   const token = params.get('access_token');
   ```
3. **Check Fragment:** Ensure redirect URL includes `#` with parameters

---

## Additional Resources

- [OAuth 2.0 Response Mode Specification](https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html)
- [PingOne Redirectless Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#redirectless-authentication)
- [Response Mode Service](../src/services/responseModeService.ts)
- [Response Mode Dropdown Component](../src/v8/components/ResponseModeDropdownV8.tsx)

---

**Last Updated:** 2025-01-27  
**Maintained By:** OAuth Playground Team
