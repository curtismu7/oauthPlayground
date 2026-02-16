# Credential Save/Load Debug Guide

## Issue
Redirect URI and Token Endpoint Authentication Method are not being saved and retrieved when restarting the flow.

## FlowKey Format
The flowKey format is: `${specVersion}-${flowType}-v8u`
- Example: `oidc-oauth-authz-v8u`
- Example: `oauth2.0-implicit-v8u`

## Storage Key Format
The storage key format is: `v8_credentials_${flowKey}`
- Example: `v8_credentials_oidc-oauth-authz-v8u`

## Save Process

### 1. When User Changes Credentials (CredentialsFormV8U.tsx)
- `handleChange` is called
- Entire `updated` credentials object is saved via `CredentialsServiceV8.saveCredentials(flowKey, updated)`
- This saves to:
  - localStorage: `v8_credentials_${flowKey}`
  - IndexedDB: backup
  - Server: `/api/credentials/save` (file-based)

### 2. When App is Selected (CredentialsFormV8U.tsx)
- `handleAppSelected` is called
- Extracts `redirectUri` from `redirectUris[0]`
- Extracts `tokenEndpointAuthMethod` and sets as `clientAuthMethod`
- Saves entire credentials object via `CredentialsServiceV8.saveCredentials(flowKey, updated)`

## Load Process

### 1. On Flow Restart (credentialReloadServiceV8U.ts)
- `reloadCredentialsAfterReset(flowKey)` is called
- Uses `loadCredentialsWithBackup(flowKey, config)` to load from:
  - localStorage (first)
  - IndexedDB (fallback 1)
  - Server backup (fallback 2)
- Merges flow-specific + shared credentials
- Returns merged credentials

### 2. Merge Logic (mergeAllCredentialFields)
- `redirectUri`: Only from flow-specific (not shared)
- `clientAuthMethod`: Flow-specific first, then shared

## Debug Steps

1. **Check localStorage directly:**
   ```javascript
   // In browser console
   const flowKey = 'oidc-oauth-authz-v8u'; // Replace with your flowKey
   const storageKey = `v8_credentials_${flowKey}`;
   const stored = localStorage.getItem(storageKey);
   console.log('Stored credentials:', JSON.parse(stored));
   ```

2. **Check what's being saved:**
   - Look for console log: `[📋 CREDENTIALS-FORM-V8] Credentials saved to storage`
   - Check instrumentation log for `hasRedirectUri` and `hasClientAuthMethod`

3. **Check what's being loaded:**
   - Look for console log: `[🔄 CREDENTIAL-RELOAD-V8U] 🔍 Loaded flow-specific credentials`
   - Check instrumentation log for `hasRedirectUri` and `hasClientAuthMethod`

4. **Check merge result:**
   - Look for console log: `[🔄 CREDENTIAL-RELOAD-V8U] ✅ Credentials reloaded from storage`
   - Check if `hasRedirectUri` and `hasClientAuthMethod` are true in merged result

## Common Issues

1. **FlowKey Mismatch:**
   - Save uses one flowKey format
   - Load uses different flowKey format
   - **Fix:** Ensure flowKey is consistent (use `${specVersion}-${flowType}-v8u`)

2. **Fields Not in Saved Object:**
   - Credentials object doesn't include redirectUri/clientAuthMethod when saving
   - **Fix:** Ensure `updated` object includes all fields before saving

3. **Merge Filtering Out Fields:**
   - Merge function filters out empty/undefined values
   - **Fix:** Merge function should include fields even if they're empty strings (for redirectUri)

4. **Storage Key Mismatch:**
   - Storage key format changed
   - **Fix:** Ensure `STORAGE_PREFIX` is consistent

## Verification Checklist

- [ ] FlowKey format matches between save and load
- [ ] redirectUri is in saved credentials object
- [ ] clientAuthMethod is in saved credentials object
- [ ] redirectUri is in loaded flowSpecific object
- [ ] clientAuthMethod is in loaded flowSpecific object
- [ ] redirectUri is in merged result
- [ ] clientAuthMethod is in merged result

## Next Steps

1. Add comprehensive logging to track save/load cycle
2. Verify flowKey consistency
3. Check if fields are being filtered out during merge
4. Test with actual browser localStorage inspection
