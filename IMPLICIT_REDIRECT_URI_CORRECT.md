# Implicit Flow Redirect URI - CORRECT URL

## Error
```
Redirect URI mismatch
```

## Correct Redirect URI

**For Implicit Flows (OAuth & OIDC):**
```
https://localhost:3000/implicit-callback
```

❌ **WRONG**: `https://localhost:3000/oauth-implicit-callback`
❌ **WRONG**: `https://localhost:3000/implicit-callback-54321`
✅ **CORRECT**: `https://localhost:3000/implicit-callback`

## Quick Fix - Run in Browser Console

Open browser console (F12) and paste:

```javascript
// Fix the redirect URI to the correct value
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
console.log('❌ OLD redirect URI:', creds.redirectUri);
creds.redirectUri = 'https://localhost:3000/implicit-callback';
localStorage.setItem('pingone_permanent_credentials', JSON.stringify(creds));
console.log('✅ NEW redirect URI:', creds.redirectUri);
location.reload();
```

## Or Fix in UI

1. Go to the Implicit Flow page
2. Find "Redirect URI" field
3. Change to: `https://localhost:3000/implicit-callback`
4. Click "Save Configuration"

## PingOne Configuration

Make sure your PingOne application has:
```
https://localhost:3000/implicit-callback
```

in the Redirect URIs list.

