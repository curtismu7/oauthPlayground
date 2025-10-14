# Implicit Flow Redirect URI Mismatch - Fix

## Error Details
```
id: b461c3fc-871e-4385-8c73-eb01e3ce763c
code: INVALID_DATA
details:
  code: INVALID_VALUE
  target: redirect_uri
  message: Redirect URI mismatch
```

## Problem
The implicit flow is using a redirect URI with "-54321" appended, which doesn't match the PingOne configuration.

## Root Cause
The redirect URI field has been incorrectly set to include "-54321" suffix, likely saved in:
- localStorage (`pingone_permanent_credentials`)
- sessionStorage credentials

## Correct Redirect URI

**OAuth Implicit Flow:**
```
https://localhost:3000/oauth-implicit-callback
```

**OIDC Implicit Flow:**
```
https://localhost:3000/oidc-implicit-callback
```

## Fix Steps

### Option 1: Clear Credentials in UI
1. Open the Implicit Flow page
2. In Step 1 (credentials section), find the "Redirect URI" field
3. **Delete the entire value**
4. The default will auto-populate: `https://localhost:3000/oauth-implicit-callback`
5. Click "Save Configuration"
6. Try the flow again

### Option 2: Clear Browser Storage (Nuclear Option)
1. Open browser console (F12)
2. Run these commands:
```javascript
// Clear bad credentials
localStorage.removeItem('pingone_permanent_credentials');
sessionStorage.clear();

// Reload page
location.reload();
```

### Option 3: Manual Fix in Console
1. Open browser console (F12)
2. Run this command to check current value:
```javascript
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
console.log('Current redirect URI:', creds.redirectUri);
```

3. If it shows the wrong URI, fix it:
```javascript
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
creds.redirectUri = 'https://localhost:3000/oauth-implicit-callback';
localStorage.setItem('pingone_permanent_credentials', JSON.stringify(creds));
console.log('✅ Fixed! New redirect URI:', creds.redirectUri);
location.reload();
```

## Verify in PingOne

Make sure your PingOne application has this **exact** redirect URI configured:

1. PingOne Admin Console
2. Applications → Your Application
3. Configuration tab
4. Redirect URIs section
5. Should include: `https://localhost:3000/oauth-implicit-callback`

## Important Notes

- ❌ **Do NOT** include `-54321` or any other suffix
- ❌ **Do NOT** include trailing slashes
- ✅ **Must match exactly** what's in PingOne
- ✅ Protocol must be `https` (not `http`) for localhost:3000

## Debugging

If still getting errors, check what's being sent:

```javascript
// In browser console on the implicit flow page
console.log('Current credentials:', 
  JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}')
);
```

Look for the `redirectUri` field and verify it matches:
```
"redirectUri": "https://localhost:3000/oauth-implicit-callback"
```

## Common Mistakes

1. **Typos**: Extra characters, spaces, or special characters
2. **Port mismatch**: Using 3001 instead of 3000
3. **Protocol**: Using `http` instead of `https`
4. **Path**: Using `/implicit-callback` instead of `/oauth-implicit-callback`
5. **Trailing slash**: `https://localhost:3000/oauth-implicit-callback/` (extra slash)

## Expected Flow

1. ✅ Correct redirect URI in field: `https://localhost:3000/oauth-implicit-callback`
2. ✅ Saved in localStorage without extra characters
3. ✅ Authorization URL uses this exact URI
4. ✅ PingOne redirects back to this URI with tokens in hash
5. ✅ App receives tokens and continues flow

