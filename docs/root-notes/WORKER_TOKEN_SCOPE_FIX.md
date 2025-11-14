# Worker Token Scope Issue - Root Cause Analysis

## Problem
Token request fails with: "At least one scope must be granted"

## Root Cause
The issue is NOT in the code - the code is sending scopes correctly. The issue is that your PingOne client application doesn't have the required scopes enabled.

## What's Happening
1. ✅ Code is correctly defaulting to: `p1:read:user p1:update:user p1:read:device p1:update:device`
2. ✅ Code is correctly sending these scopes in the token request
3. ❌ **PingOne is rejecting the request because the client doesn't have these scopes granted**

## Solution - Configure PingOne Client

You need to configure your PingOne application to have the correct scopes:

### Option 1: Use Simple Scopes (Recommended for Testing)
Change the default scopes to basic OpenID scopes that ALL clients have:

```typescript
// Instead of:
'p1:read:user p1:update:user p1:read:device p1:update:device'

// Use:
'openid profile email'
```

### Option 2: Grant Management API Scopes (For Production)
1. Go to PingOne Admin Console
2. Find your worker application
3. Go to "Resources" tab
4. Enable "PingOne API" resource
5. Grant these scopes:
   - `p1:read:user`
   - `p1:update:user`
   - `p1:read:device`
   - `p1:update:device`

### Option 3: Check What Scopes Are Available
Use OIDC Discovery to see what scopes your environment supports:

```bash
curl https://auth.pingone.com/{your-env-id}/.well-known/openid-configuration | jq .scopes_supported
```

## Quick Fix
I'll update the default scopes to use basic OpenID scopes that work with all clients.

