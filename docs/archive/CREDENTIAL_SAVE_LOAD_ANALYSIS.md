# Credential Save/Load Analysis & Implementation

## Overview
This document provides a complete analysis of the credential saving and retrieval system for the Unified OAuth Flow, ensuring ALL fields (basic + advanced options) are properly persisted across flow type changes and flow restarts.

## All Fields That Must Be Saved

### Basic Credentials
- `environmentId`: PingOne environment ID
- `clientId`: Application client ID
- `clientSecret`: Client secret (if available)
- `redirectUri`: Flow-specific redirect URI
- `postLogoutRedirectUri`: Post-logout redirect URI
- `logoutUri`: Logout URI
- `scopes`: OAuth scopes (space-separated)
- `responseType`: OAuth response type
- `issuerUrl`: OIDC issuer URL
- `clientAuthMethod`: Token endpoint authentication method
  - Values: `'none'`, `'client_secret_basic'`, `'client_secret_post'`, `'client_secret_jwt'`, `'private_key_jwt'`
- `privateKey`: Private key for `private_key_jwt` authentication

### Advanced Options (OAuth/OIDC Parameters)
- `responseMode`: How authorization response is returned
  - Values: `'query'`, `'fragment'`, `'form_post'`, `'pi.flow'`
- `usePAR`: Enable Pushed Authorization Requests (RFC 9126)
  - Type: `boolean`
- `maxAge`: Maximum authentication age in seconds
  - Type: `number | undefined`
- `display`: Controls how authentication UI is displayed
  - Values: `'page'`, `'popup'`, `'touch'`, `'wap'`
- `prompt`: Authorization prompt values
  - Values: `'none'`, `'login'`, `'consent'`
- `loginHint`: Pre-fills username/email in login form
  - Type: `string` (can be empty string)

### PKCE Settings
- `pkceEnforcement`: PKCE enforcement level
  - Values: `'OPTIONAL'`, `'REQUIRED'`, `'S256_REQUIRED'`
- `usePKCE`: Legacy boolean field (kept for backward compatibility)
  - Type: `boolean`

### Token Settings
- `enableRefreshToken`: Enable refresh token support
  - Type: `boolean`
- `useRedirectless`: DEPRECATED - Use `responseMode='pi.flow'` instead
  - Type: `boolean`

## Storage Strategy

### Flow-Specific Storage
**Key Format**: `{specVersion}-{flowType}-v8u`
- Example: `oidc-oauth-authz-v8u`, `oauth2.0-implicit-v8u`

**What Gets Stored**:
- ALL fields from `UnifiedFlowCredentials`
- Flow-specific values (e.g., different `redirectUri` per flow)
- Advanced options (per-flow configuration)

**Storage Locations**:
1. **localStorage** (primary, synchronous)
2. **IndexedDB** (backup, async)
3. **Backend Database** (file-based, persistent across browsers/machines)

### Shared Storage
**What Gets Stored**:
- `environmentId`
- `clientId`
- `clientSecret`
- `issuerUrl`
- `clientAuthMethod`

**Storage Locations**:
1. **localStorage** (primary, synchronous)
2. **Backend Database** (file-based, persistent across browsers/machines)

## Save Operations

### 1. `handleChange` in `CredentialsFormV8U.tsx`
**When**: User changes any field in the credentials form
**What Gets Saved**:
- Entire `updated` credentials object (includes ALL fields)
- Saves to flow-specific storage via `CredentialsServiceV8.saveCredentials(flowKey, updated)`
- Also saves shared credentials if applicable

**Location**: `src/v8u/components/CredentialsFormV8U.tsx:1368-1397`

### 2. `handleAppSelected` in `CredentialsFormV8U.tsx`
**When**: User selects an application from PingOne app lookup
**What Gets Saved**:
- `clientId` (from app)
- `clientSecret` (from app, if available)
- `redirectUri` (first URI from `redirectUris` array)
- `clientAuthMethod` (from `tokenEndpointAuthMethod`)
- `pkceEnforcement` (from `pkceEnforced`/`pkceRequired`)
- All other existing credentials (preserved)

**Location**: `src/v8u/components/CredentialsFormV8U.tsx:1598-1630`

### 3. Auto-Save Effect in `UnifiedOAuthFlowV8U.tsx`
**When**: Credentials change in parent component (debounced 100ms)
**What Gets Saved**:
- Entire `credentials` object (includes ALL fields)
- Saves to flow-specific storage
- Also saves shared credentials

**Location**: `src/v8u/flows/UnifiedOAuthFlowV8U.tsx:868-929`

## Load Operations

### 1. Initial Load in `UnifiedOAuthFlowV8U.tsx`
**When**: Component mounts, flow type changes, or page becomes visible
**What Gets Loaded**:
- Flow-specific credentials from storage
- Shared credentials from storage
- Merges with priority: flow-specific > shared > defaults
- **CRITICAL**: Now includes ALL advanced options in merge

**Location**: `src/v8u/flows/UnifiedOAuthFlowV8U.tsx:601-780`

### 2. `reloadCredentialsAfterReset` in `credentialReloadServiceV8U.ts`
**When**: User clicks "Restart Flow" button
**What Gets Loaded**:
- Flow-specific credentials from storage
- Shared credentials from storage
- Merges with priority: flow-specific > shared > defaults
- **CRITICAL**: Now includes ALL advanced options including `pkceEnforcement` and `privateKey`

**Location**: `src/v8u/services/credentialReloadServiceV8U.ts:62-264`

## Fixes Applied

### 1. Added Missing Fields to Reload Service
- ✅ Added `pkceEnforcement` to `reloadCredentialsAfterReset`
- ✅ Added `privateKey` to `reloadCredentialsAfterReset`
- ✅ Added `logoutUri` to `reloadCredentialsAfterReset`
- ✅ Enhanced `loginHint` handling (explicitly handles empty string)

### 2. Added Missing Fields to UnifiedOAuthFlowV8U Load
- ✅ Added `pkceEnforcement` to merge operation
- ✅ Added `privateKey` to merge operation
- ✅ Added `logoutUri` to merge operation
- ✅ Enhanced `loginHint` handling (explicitly handles empty string)

### 3. Enhanced App Lookup
- ✅ Extracts `redirectUri` from `redirectUris` array (first URI)
- ✅ Extracts `tokenEndpointAuthMethod` and sets as `clientAuthMethod`
- ✅ Handles both camelCase and snake_case from PingOne API

### 4. Created Helper Function
- ✅ Created `mergeAllCredentialFields` helper function for consistent merging
- ✅ Ensures ALL fields from `UnifiedFlowCredentials` are included

### 5. Enhanced Logging
- ✅ Added comprehensive instrumentation to track what's saved
- ✅ Added comprehensive instrumentation to track what's loaded
- ✅ Logs all advanced options in save/load operations

## Storage Backups

### Browser Storage
1. **localStorage** (primary)
   - Fast, synchronous access
   - Persists across browser sessions
   - Cleared when user clears browser data

2. **IndexedDB** (backup)
   - Async, more persistent
   - Better for large data
   - Survives some browser data clearing scenarios

### Database Backup
- **Backend File Storage** (`/api/credentials/save`)
  - Persistent across browsers
  - Persistent across machines
  - File-based storage in `credentials/v8u/{flowKey}.json`

## Testing Checklist

### Flow Type Change
- [ ] Change flow type (e.g., from `oauth-authz` to `implicit`)
- [ ] Verify ALL credentials are preserved:
  - [ ] Basic: environmentId, clientId, clientSecret, redirectUri, scopes
  - [ ] Advanced: responseMode, usePAR, maxAge, display, prompt, loginHint
  - [ ] PKCE: pkceEnforcement
  - [ ] Auth: clientAuthMethod, privateKey
- [ ] Verify flow-specific values (e.g., redirectUri) are flow-specific

### Restart Flow
- [ ] Configure credentials with advanced options
- [ ] Click "Restart Flow" button
- [ ] Verify ALL credentials are restored:
  - [ ] Basic: environmentId, clientId, clientSecret, redirectUri, scopes
  - [ ] Advanced: responseMode, usePAR, maxAge, display, prompt, loginHint
  - [ ] PKCE: pkceEnforcement
  - [ ] Auth: clientAuthMethod, privateKey

### App Lookup
- [ ] Use app lookup to select an application
- [ ] Verify `redirectUri` is set from PingOne
- [ ] Verify `clientAuthMethod` is set from PingOne
- [ ] Click "Restart Flow"
- [ ] Verify `redirectUri` and `clientAuthMethod` are still present

### Browser Refresh
- [ ] Configure credentials
- [ ] Refresh browser (F5)
- [ ] Verify ALL credentials are restored

### Incognito Mode
- [ ] Configure credentials in incognito mode
- [ ] Close and reopen incognito window
- [ ] Verify credentials are restored (via IndexedDB backup)

## Known Issues Fixed

1. ✅ **Missing `pkceEnforcement` in reload service** - Fixed
2. ✅ **Missing `privateKey` in reload service** - Fixed
3. ✅ **Missing `logoutUri` in reload service** - Fixed
4. ✅ **Advanced options not loaded on flow type change** - Fixed
5. ✅ **App lookup not setting `redirectUri`** - Fixed
6. ✅ **App lookup not setting `clientAuthMethod`** - Fixed
7. ✅ **`loginHint` empty string not handled** - Fixed

## Files Modified

1. `src/v8u/services/credentialReloadServiceV8U.ts`
   - Added `mergeAllCredentialFields` helper function
   - Added missing fields: `pkceEnforcement`, `privateKey`, `logoutUri`
   - Enhanced logging

2. `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`
   - Added missing fields to merge operation: `pkceEnforcement`, `privateKey`, `logoutUri`
   - Enhanced logging
   - Added instrumentation to auto-save effect

3. `src/v8u/components/CredentialsFormV8U.tsx`
   - Fixed `redirectUri` extraction from app lookup
   - Fixed `tokenEndpointAuthMethod` extraction from app lookup
   - Enhanced logging

4. `src/v8/services/appDiscoveryServiceV8.ts`
   - Enhanced field extraction to handle both camelCase and snake_case
   - Enhanced logging

5. `src/v8/services/credentialsServiceV8.ts`
   - Added instrumentation to `saveCredentials`
   - Added instrumentation to `loadCredentials`

## Next Steps

1. Test all scenarios in the testing checklist
2. Verify instrumentation logs show all fields being saved/loaded
3. Remove instrumentation after verification (if requested)
4. Document any edge cases discovered during testing
