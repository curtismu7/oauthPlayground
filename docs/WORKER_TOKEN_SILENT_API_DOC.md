# Worker Token Silent API Retrieval Documentation

**Last Updated:** 2026-01-06 21:00:00

## Overview

The Worker Token Silent API Retrieval feature allows the application to automatically fetch worker tokens in the background without showing modals or UI prompts. This provides a seamless user experience when credentials are already configured.

## How It Works

### Silent API Retrieval Checkbox

**Location:** 
- MFA Hub page (`/v8/mfa-hub`)
- MFA Authentication page (`/v8/mfa`)
- MFA Configuration page (`/v8/mfa-config`)

**Behavior:**
- When **enabled (checked)**: The application will attempt to automatically fetch worker tokens in the background when:
  - The page loads and no valid token exists
  - The checkbox is toggled ON and no valid token exists
  - A token expires and needs renewal
- When **disabled (unchecked)**: The application will show modals or prompts when a token is needed

### Show Token After Generation Checkbox

**Location:** Same as above

**Behavior:**
- When **enabled (checked)**: After a token is successfully generated (silently or manually), a modal will display the token
- When **disabled (unchecked)**: No modal is shown after token generation

### Mutual Exclusivity

**Important:** These two checkboxes are mutually exclusive:
- If "Silent API Token Retrieval" is **ON** → "Show Token After Generation" is automatically **OFF** (silent means no modals)
- If "Show Token After Generation" is **ON** → "Silent API Token Retrieval" is automatically **OFF** (showing token means not silent)

## Current Limitations

### Silent API Retrieval Requirements

For silent API retrieval to work, the following must be true:

1. **Credentials Must Be Saved**: 
   - User must have previously saved worker token credentials (via "Get Worker Token" button with "Save credentials for next time" checked)
   - Credentials are stored in `workerTokenServiceV8` storage

2. **Token Must Be Missing or Expired**:
   - Silent retrieval only triggers when there's no valid token
   - If a valid token exists, no action is taken

3. **Automatic Trigger Points**:
   - On page load (if token is missing/expired)
   - When checkbox is toggled ON (if token is missing/expired)
   - When token expires during use

### Known Issues

1. **Silent API Retrieval May Not Work If:**
   - Credentials were not saved previously (user needs to click "Get Worker Token" and save credentials first)
   - The token endpoint returns an error (authentication failed, invalid credentials, etc.)
   - Network errors occur during the fetch

2. **Show Token After Generation Works Correctly:**
   - This checkbox functions as expected
   - When enabled, it displays the token in a modal after successful generation

## Implementation Details

### Storage Location

Credentials are stored using `workerTokenServiceV8.saveCredentials()`, which saves to:
- Primary: Browser localStorage (`v8:worker_token`)
- Backup: IndexedDB (`oauth_playground_v8` database)

### Silent Retrieval Flow

1. Check if `silentApiRetrieval` is enabled in configuration
2. Load credentials from `workerTokenServiceV8.loadCredentials()`
3. If credentials exist, make a POST request to `/api/pingone/token` with:
   - `environment_id`
   - `client_id`
   - `client_secret`
   - `scope`
   - `region`
   - `auth_method`
4. If successful, save token and dispatch `workerTokenUpdated` event
5. If `showTokenAtEnd` is enabled, show modal with token
6. If failed, remain silent (no modals or errors shown)

### Code Locations

- **Helper Function**: `src/v8/utils/workerTokenModalHelperV8.ts`
  - `attemptSilentTokenRetrieval()`: Performs the silent token fetch
  - `handleShowWorkerTokenModal()`: Main handler that respects silent settings

- **UI Components**:
  - `src/v8/flows/MFAHubV8.tsx`: Hub page with checkboxes
  - `src/v8/flows/MFAAuthenticationMainPageV8.tsx`: Authentication page with checkboxes
  - `src/v8/flows/MFAConfigurationPageV8.tsx`: Configuration page with checkboxes

- **Service**:
  - `src/v8/services/workerTokenServiceV8.ts`: Credential and token storage
  - `src/v8/services/mfaConfigurationServiceV8.ts`: Configuration storage

## Troubleshooting

### Silent API Retrieval Not Working

1. **Check if credentials are saved:**
   - Open browser DevTools → Application → Local Storage
   - Look for key `v8:worker_token`
   - If missing, click "Get Worker Token" and ensure "Save credentials for next time" is checked

2. **Check console logs:**
   - Look for `[🔑 WORKER-TOKEN-MODAL-HELPER-V8]` logs
   - Check for "No stored credentials for silent API retrieval" warning
   - Check for API errors from `/api/pingone/token`

3. **Verify checkbox state:**
   - Ensure "Silent API Token Retrieval" is checked
   - Ensure "Show Token After Generation" is unchecked (automatically disabled when Silent is ON)

4. **Manual trigger:**
   - Toggle "Silent API Token Retrieval" OFF then ON again
   - This will trigger a silent retrieval attempt if token is missing

### Show Token After Generation Not Working

1. **Check if checkbox is enabled:**
   - Ensure "Show Token After Generation" is checked
   - Note: This will automatically disable "Silent API Token Retrieval"

2. **Check if token was generated:**
   - Look for success toast: "Worker token automatically retrieved!" or "Worker token generated successfully!"
   - If no success message, token generation may have failed

## Future Improvements

1. Add retry logic for failed silent retrievals
2. Add user notification when silent retrieval fails (optional, configurable)
3. Add periodic token refresh when silent retrieval is enabled
4. Add better error handling and logging for debugging

