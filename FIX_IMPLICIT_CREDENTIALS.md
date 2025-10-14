# Fix Implicit Flow - Wrong Client ID Loading

## Problem
The implicit flow is loading the **wrong client ID** from permanent shared credentials.

## Root Cause
All flows use `credentialManager.getAllCredentials()` which loads from:
```
localStorage.getItem('pingone_permanent_credentials')
```

This is the **shared/global** credentials used across ALL flows as a fallback.

## Diagnosis Script
Run this in your browser console (F12):

```javascript
// Check what's stored
const permanent = localStorage.getItem('pingone_permanent_credentials');
if (permanent) {
    const parsed = JSON.parse(permanent);
    console.log("❌ WRONG Client ID:", parsed.clientId);
    console.log("   Environment ID:", parsed.environmentId);
    console.log("   Redirect URI:", parsed.redirectUri);
} else {
    console.log("ℹ️  No permanent credentials found");
}
```

## Fix Option 1: Update Permanent Credentials (Recommended)
Run this in browser console to update the **shared** credentials:

```javascript
// Update the permanent credentials with CORRECT values
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');

console.log("❌ OLD Client ID:", creds.clientId);

// 🔧 UPDATE THESE WITH YOUR CORRECT VALUES:
creds.clientId = 'YOUR_CORRECT_CLIENT_ID';  // e.g. 'a4f963ea-0736-456a-be72-b1fa4f63f81f'
creds.environmentId = 'YOUR_ENVIRONMENT_ID';
creds.redirectUri = 'https://localhost:3000/implicit-callback';

localStorage.setItem('pingone_permanent_credentials', JSON.stringify(creds));

console.log("✅ NEW Client ID:", creds.clientId);
console.log("✅ Updated permanent credentials");
location.reload();
```

## Fix Option 2: Save Flow-Specific Credentials
Use the UI to save credentials specifically for the implicit flow:

1. Go to Implicit Flow page
2. Enter your correct credentials:
   - Client ID: `YOUR_CORRECT_CLIENT_ID`
   - Environment ID: `YOUR_ENVIRONMENT_ID`  
   - Redirect URI: `https://localhost:3000/implicit-callback`
3. Click **"Save Configuration"**

This will save flow-specific credentials that override the permanent ones.

## Why This Happens
1. You saved credentials in **one flow** (e.g., Authorization Code)
2. Those credentials were saved as **permanent/shared** credentials
3. When you switched to **Implicit Flow**, it loaded those shared credentials
4. But the Client IDs are **different** for each flow/application in PingOne

## Solution
Each PingOne application has its own Client ID. You need to either:
- Use **one PingOne app** for all flows (same client ID everywhere)
- Save **flow-specific** credentials for each flow (different client IDs)

## Verify Fix
After fixing, run this in console:

```javascript
const permanent = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
console.log("✅ Permanent Client ID:", permanent.clientId);

const implicitCreds = sessionStorage.getItem('implicit-flow-v5-credentials') || 
                      sessionStorage.getItem('oauth-implicit-v5-credentials') ||
                      sessionStorage.getItem('oidc-implicit-v5-credentials');
if (implicitCreds) {
    const parsed = JSON.parse(implicitCreds);
    console.log("✅ Implicit Flow Client ID:", parsed.clientId);
}
```

Both should show the **correct** client ID now!

