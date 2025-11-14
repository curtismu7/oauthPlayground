# Worker Token Tester Page

## Overview
A new page that allows users to paste a PingOne worker token, decode it, and validate it against the PingOne API in real-time.

## Features

### 1. Token Decoding
- Paste JWT token in textarea
- Automatic decoding of token payload
- Real-time validation of JWT format
- Error handling for invalid tokens

### 2. Token Information Display
Beautiful card-based UI showing:
- **Status Card**: Shows if token is VALID or EXPIRED with time remaining
- **Client ID Card**: OAuth client identifier
- **Environment ID Card**: PingOne environment
- **Organization ID Card**: PingOne organization

Additional details shown:
- Issued At timestamp
- Expires At timestamp
- Issuer URL
- Audience (API endpoints)
- Scope (if present)
- JWT ID (jti)

### 3. API Validation
Tests the token against real PingOne APIs:

#### Test 1: Get Environment
```
GET https://api.pingone.com/v1/environments/{environmentId}
```
- Validates token is valid
- Confirms environment read permissions
- Shows environment name and type

#### Test 2: List Users
```
GET https://api.pingone.com/v1/environments/{environmentId}/users?limit=1
```
- Tests user read permissions
- Shows if token can query users
- Gracefully handles 403 (permission denied)

#### Test 3: List Applications
```
GET https://api.pingone.com/v1/environments/{environmentId}/applications?limit=1
```
- Tests application read permissions
- Shows if token can query applications
- Gracefully handles 403 (permission denied)

### 4. API Display Integration
All API calls are automatically logged to the API Display Service:
- Request details (method, URL, headers)
- Response details (status, data)
- Visible in the API display panel

### 5. Visual Feedback
- ✅ Success indicators (green)
- ❌ Error indicators (red)
- ⚠️ Warning indicators (orange) for permission issues
- Status codes displayed for each test
- Detailed error messages from PingOne

## UI Design

### Color Scheme
- **Success**: Green (#4caf50)
- **Error**: Red (#d32f2f)
- **Warning**: Orange (#ff9800)
- **Info**: Blue (#2196f3)
- **Background**: White with subtle shadows
- **Cards**: Light gray (#f5f5f5)

### Layout
- Clean, modern card-based design
- Responsive grid for token info cards
- Full-width token input textarea
- Prominent test button
- Collapsible test results

### Icons
- FiKey: Token/Client ID
- FiClock: Expiration status
- FiGlobe: Environment
- FiUser: Organization/Users
- FiCheckCircle: Success
- FiXCircle: Error
- FiAlertCircle: Warning

## Usage

### Access the Page
Navigate to: `/worker-token-tester`

### Steps
1. **Paste Token**: Copy your PingOne worker token and paste it into the textarea
2. **View Info**: Token information is automatically decoded and displayed
3. **Test Token**: Click "Test Token Against PingOne API" button
4. **Review Results**: See validation results for each API test
5. **Check API Calls**: Open API display panel to see detailed request/response

### Example Token Format
```
eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHQiLCJ4NXQiOiIwV01SZmxrZTlGQ1NKbWtmN0JFSWVmbEllS1UifQ.eyJjbGllbnRfaWQiOiI2NmE0Njg2Yi05MjIyLTRhZDItOTFiNi0wMzExMzcxMWM5YWEiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vYjk4MTdjMTYtOTkxMC00NDE1LWI2N2UtNGFjNjg3ZGE3NGQ5L2FzIiwianRpIjoiOGExY2FiODEtMDVhMi00NjM0LTg3MGYtNGRkYTUzYWUzODJlIiwiaWF0IjoxNzYzMDY2ODg2LCJleHAiOjE3NjMwNzA0ODYsImF1ZCI6WyJodHRwczovL2FwaS5waW5nb25lLmNvbSJdLCJlbnYiOiJiOTgxN2MxNi05OTEwLTQ0MTUtYjY3ZS00YWM2ODdkYTc0ZDkiLCJvcmciOiI5N2JhNDRmMi1mN2VlLTQxNDQtYWE5NS05ZTYzNmI1N2MwOTYiLCJwMS5yaWQiOiI4YTFjYWI4MS0wNWEyLTQ2MzQtODcwZi00ZGRhNTNhZTM4MmUifQ.XxjvcRn1CZmI-hOH6sNrOcSZO58IcVCxIbYlrdac1PZpuxo7DB9tkji4cu5a6hclHcpD685cx06x4H6lBKy1fTvnUEAABKEULnkeSePKYej5_kWBIcawBvq5G1wgtNRrz33tZxIrGxaAHtZbkd-_2wcw2vSg2eRg21LwwsFWO50EuC0UINYosLSZ4S8W2VpwvnlIwFmF0OkbaJ3NUbzvbl_3xfk1iAok8I0eqwCRaiBh0MNGlFDkChRjJAzLWM13CTf16CPp8XBdzTVv4pox0PZGF4O-el5iKpPgsIu4PgbmuxSXrOdSYGRN1AfOEaM0fLr4oe42r15KvJb9oJ3Uxg
```

## Technical Details

### Files Created
- `src/pages/WorkerTokenTester.tsx` - Main page component

### Files Modified
- `src/App.tsx` - Added route and import

### Dependencies
- React
- styled-components
- react-icons (FiCheckCircle, FiXCircle, FiClock, FiKey, FiUser, FiGlobe, FiAlertCircle)
- apiDisplayService (for logging API calls)

### API Calls
All API calls use native `fetch()` with:
- Method: GET
- Headers: Authorization Bearer token, Content-Type application/json
- CORS: Handled by browser (PingOne API supports CORS)

### Error Handling
- Invalid JWT format detection
- Expired token warning
- Network error handling
- API error response parsing
- CORS error detection

## Use Cases

### 1. Token Validation
Quickly verify if a worker token is valid before using it in your application.

### 2. Permission Testing
Check what permissions a worker token has (users, applications, etc.).

### 3. Debugging
When authentication fails, paste the token to see if it's expired or lacks permissions.

### 4. Token Comparison
Compare multiple tokens to see their different permissions and expiration times.

### 5. Learning Tool
Understand JWT structure and PingOne API responses.

## Future Enhancements

### Potential Features
- [ ] Save token history (last 5 tokens tested)
- [ ] Export test results as JSON/PDF
- [ ] Test additional API endpoints (populations, groups, etc.)
- [ ] Token introspection endpoint test
- [ ] Compare two tokens side-by-side
- [ ] Generate new worker token from client credentials
- [ ] Token refresh functionality
- [ ] Decode ID tokens and access tokens (not just worker tokens)
- [ ] Show token scopes in a visual permission matrix

### UI Improvements
- [ ] Dark mode support
- [ ] Collapsible sections
- [ ] Copy token info to clipboard
- [ ] Share test results via URL
- [ ] Print-friendly view

## Security Notes

### Token Handling
- Tokens are only stored in component state (not persisted)
- Tokens are not sent to any third-party services
- All API calls go directly to PingOne
- Token is truncated in API display logs (first 20 chars only)

### Best Practices
- Never share worker tokens publicly
- Rotate tokens regularly
- Use tokens with minimal required permissions
- Monitor token usage in PingOne console

## Testing

### Manual Testing Checklist
- [ ] Paste valid token - should decode successfully
- [ ] Paste invalid token - should show error
- [ ] Paste expired token - should show expired status
- [ ] Test with valid token - all tests should pass
- [ ] Test with expired token - should show 401 errors
- [ ] Test with limited permissions - should show 403 warnings
- [ ] Check API display panel - should show all requests/responses
- [ ] Responsive design - should work on mobile/tablet

### Test Tokens
Use the test script to generate test tokens:
```bash
node test-worker-token.cjs
```

## Documentation

### For Users
Add to user guide:
1. How to get a worker token
2. How to use the tester
3. Understanding test results
4. Troubleshooting common issues

### For Developers
- Component architecture
- API integration patterns
- Error handling strategies
- Styling conventions

---

**Status**: ✅ Complete
**Route**: `/worker-token-tester`
**Date**: 2025-11-13
