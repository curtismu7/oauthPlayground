# Protect Portal Environment Variables Fix

## Issue
The Protect Portal was throwing `ReferenceError: process is not defined` errors in the browser because the configuration files were using Node.js-style environment variables (`process.env`) which are not available in browser environments.

## Root Cause
Vite (the build tool) uses `import.meta.env` for environment variables in the browser, not `process.env` which is a Node.js-specific API.

## Files Fixed

### 1. `src/pages/protect-portal/config/protectPortalAppConfig.ts`
**Before:**
```typescript
environmentId: process.env.REACT_APP_PINGONE_ENVIRONMENT_ID || 'your-environment-id',
clientId: process.env.REACT_APP_PINGONE_CLIENT_ID || 'your-client-id',
clientSecret: process.env.REACT_APP_PINGONE_CLIENT_SECRET || 'your-client-secret',
redirectUri: process.env.REACT_APP_PINGONE_REDIRECT_URI || 'http://localhost:3000/protect-portal-callback',

environmentId: process.env.REACT_APP_PROTECT_ENVIRONMENT_ID || 'your-protect-environment-id',
workerToken: process.env.REACT_APP_PROTECT_WORKER_TOKEN || 'your-protect-worker-token',
region: (process.env.REACT_APP_PROTECT_REGION || 'us') as 'us' | 'eu' | 'ap' | 'ca',

const isDevelopment = process.env.NODE_ENV === 'development';
```

**After:**
```typescript
environmentId: import.meta.env.VITE_PINGONE_ENVIRONMENT_ID || 'your-environment-id',
clientId: import.meta.env.VITE_PINGONE_CLIENT_ID || 'your-client-id',
clientSecret: import.meta.env.VITE_PINGONE_CLIENT_SECRET || 'your-client-secret',
redirectUri: import.meta.env.VITE_PINGONE_REDIRECT_URI || 'http://localhost:3000/protect-portal-callback',

environmentId: import.meta.env.VITE_PROTECT_ENVIRONMENT_ID || 'your-protect-environment-id',
workerToken: import.meta.env.VITE_PROTECT_WORKER_TOKEN || 'your-protect-worker-token',
region: (import.meta.env.VITE_PROTECT_REGION || 'us') as 'us' | 'eu' | 'ap' | 'ca',

const isDevelopment = import.meta.env.DEV;
```

### 2. `src/pages/protect-portal/config/protectPortal.config.ts`
**Before:**
```typescript
const environment = process.env.NODE_ENV || 'development';
```

**After:**
```typescript
const environment = import.meta.env.MODE || 'development';
```

## Environment Variable Mapping

| Create React App (Old) | Vite (New) |
|------------------------|------------|
| `process.env.REACT_APP_*` | `import.meta.env.VITE_*` |
| `process.env.NODE_ENV` | `import.meta.env.MODE` |
| `process.env.NODE_ENV === 'development'` | `import.meta.env.DEV` |

## Verification
- ✅ All `process.env` references removed from Protect Portal
- ✅ TypeScript compilation passes without errors
- ✅ Environment variables now use Vite-compatible syntax
- ✅ Browser compatibility ensured

## Usage
To use these environment variables in Vite, create a `.env` file in the project root:

```bash
# PingOne Configuration
VITE_PINGONE_ENVIRONMENT_ID=your-environment-id
VITE_PINGONE_CLIENT_ID=your-client-id
VITE_PINGONE_CLIENT_SECRET=your-client-secret
VITE_PINGONE_REDIRECT_URI=http://localhost:3000/protect-portal-callback

# Protect Configuration  
VITE_PROTECT_ENVIRONMENT_ID=your-protect-environment-id
VITE_PROTECT_WORKER_TOKEN=your-protect-worker-token
VITE_PROTECT_REGION=us
```

Note: Variables must be prefixed with `VITE_` to be exposed to the browser in Vite.
