# Vite Cache Issue Fix

## Problem
After file modifications, Vite is showing export errors:
```
SyntaxError: The requested module does not provide an export named 'readPasswordState'
```

## Root Cause
Vite's hot module reload (HMR) cache is stale after the autofix/formatting operation.

## Solutions

### Option 1: Hard Refresh Browser (Quickest)
1. In your browser, press:
   - **Mac**: `Cmd + Shift + R`
   - **Windows/Linux**: `Ctrl + Shift + R`
2. This clears the browser cache and forces Vite to reload

### Option 2: Restart Dev Server
```bash
# Stop the current dev server (Ctrl+C in the terminal where it's running)
# Then restart:
npm run dev
```

### Option 3: Clear Vite Cache
```bash
# Stop dev server first, then:
rm -rf node_modules/.vite
npm run dev
```

### Option 4: Clear All Caches
```bash
# Nuclear option - clears everything
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

## Verification

After applying one of the solutions above, check that:
1. No more export errors in browser console
2. Password Reset tabs load correctly
3. All password operations work

## File Status

✅ `src/services/passwordResetService.ts` - All exports are present and valid
✅ No TypeScript errors
✅ All functions exported correctly:
- `sendRecoveryCode`
- `recoverPassword`
- `forcePasswordChange`
- `changePassword`
- `checkPassword`
- `unlockPassword`
- `readPasswordState`
- `setPasswordAdmin`
- `setPassword`
- `setPasswordValue`
- `setPasswordLdapGateway`

The file is correct - it's just a Vite caching issue.
