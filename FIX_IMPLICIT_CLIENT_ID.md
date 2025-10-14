# Fix Implicit Flow - Set Correct Client ID

## Problem
Implicit Flow is loading wrong client ID from shared credentials.

## Your Correct Client ID
```
4a275422-e580-4be6-84f2-3a624a849cbb
```

## Quick Fix - Copy/Paste into Browser Console (F12)

**Option 1: Update Permanent Shared Credentials**
```javascript
// Get current credentials
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');

console.log("❌ OLD Client ID:", creds.clientId);
console.log("❌ OLD Environment ID:", creds.environmentId);
console.log("❌ OLD Redirect URI:", creds.redirectUri);

// Update with correct values
creds.clientId = '4a275422-e580-4be6-84f2-3a624a849cbb';
// Keep existing environmentId if it's correct, or update:
// creds.environmentId = 'YOUR_ENV_ID_HERE';
creds.redirectUri = 'https://localhost:3000/implicit-callback';

// Save updated credentials
localStorage.setItem('pingone_permanent_credentials', JSON.stringify(creds));

console.log("✅ NEW Client ID:", creds.clientId);
console.log("✅ NEW Redirect URI:", creds.redirectUri);
console.log("✅ Credentials updated! Reloading page...");
location.reload();
```

**Option 2: Clear All and Start Fresh**
```javascript
// Clear ONLY the permanent credentials (not flow-specific ones)
console.log("🗑️  Clearing permanent credentials...");
localStorage.removeItem('pingone_permanent_credentials');
console.log("✅ Cleared! Now use UI to save new credentials");
location.reload();
```

## After Running Script

1. **Verify the fix** - run this in console:
   ```javascript
   const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
   console.log("Client ID:", creds.clientId);
   console.log("Should be: 4a275422-e580-4be6-84f2-3a624a849cbb");
   console.log("Match:", creds.clientId === '4a275422-e580-4be6-84f2-3a624a849cbb' ? '✅' : '❌');
   ```

2. **Go to Implicit Flow page** and verify:
   - Client ID field shows: `4a275422-e580-4be6-84f2-3a624a849cbb`
   - Redirect URI shows: `https://localhost:3000/implicit-callback`

3. **Click "Save Configuration"** to persist flow-specific credentials

## PingOne Configuration Required

Make sure your PingOne application with client ID `4a275422-e580-4be6-84f2-3a624a849cbb` has:

1. **Redirect URI configured:**
   ```
   https://localhost:3000/implicit-callback
   ```

2. **Grant Type enabled:**
   - ✅ Implicit

3. **Response Types enabled:**
   - ✅ Token (for OAuth)
   - ✅ ID Token (for OIDC)

## Done! 🎉

After running the script and reloading, the Implicit Flow should use the correct client ID.

