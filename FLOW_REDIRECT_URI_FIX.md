# Flow Redirect URI Fix - Summary

## Issues Fixed

### 1. Infinite Loop in UnifiedFlowSteps.tsx
**Problem:** Multiple `useEffect` hooks had circular dependencies causing infinite re-renders.

**Fixed:**
- **Line 810-843**: Removed auto-restoration of PKCE codes that had `flowState.codeVerifier` and `flowState.codeChallenge` in dependencies while also updating them
- **Line 558-680**: Removed auto-restoration of PKCE codes on step 4 (token exchange)
- **Line 243-258**: Removed auto-loading of PKCE codes from storage on component mount

**Reason:** This is an educational tool - users should manually generate PKCE codes by clicking the button in Step 1, not have them auto-generated or auto-restored.

### 2. Infinite Loop in comprehensiveCredentialsService.tsx
**Problem:** `useEffect` at line 810 had `resolvedCredentials` in dependencies, but calling `onCredentialsChange` with `resolvedCredentials` caused it to recompute.

**Fixed:**
- Removed `resolvedCredentials` from dependency array
- Simplified dependencies to only `actualRedirectUri` and `redirectUri`
- Built credentials object inline instead of using `resolvedCredentials`

### 3. Redirect URI Not Updating When Changing Flow Types
**Problem:** When switching from Authorization Code to Implicit flow, the redirect URI stayed as `/authz-callback` instead of updating to `/implicit-callback`.

**Fixed:**
- Added new `useEffect` at line 800 that watches for `flowType` changes
- When flow type changes, it automatically updates the redirect URI to the flow-specific default
- Uses `FlowRedirectUriService.getDefaultRedirectUri(flowType)` to get the correct URI

## Flow Type → Redirect URI Mappings

The following mappings are now correctly applied when switching flows:

| Flow Type | Redirect URI |
|-----------|-------------|
| `oauth-authz` | `https://localhost:3000/authz-callback` |
| `implicit` | `https://localhost:3000/implicit-callback` |
| `hybrid` | `https://localhost:3000/hybrid-callback` |
| `device-code` | `https://localhost:3000/device-code-status` |
| `client-credentials` | `https://localhost:3000/worker-token-callback` |
| `ropc` | (none - doesn't use redirect URI) |

## How It Works

1. **Flow Type Change Detection**: When user changes flow type in the UI, the `useEffect` at line 800 detects the change
2. **Get Flow-Specific URI**: Calls `FlowRedirectUriService.getDefaultRedirectUri(flowType)` to get the correct redirect URI
3. **Update Credentials**: If the current redirect URI doesn't match the flow-specific one, it updates via `onRedirectUriChange` or `onCredentialsChange`
4. **UI Updates**: The redirect URI field in the form automatically updates to show the correct value

## Services Used

- **FlowRedirectUriService**: Maps flow types to redirect URIs
- **callbackUriService**: Provides the actual callback URI paths
- **getCallbackTypesForFlow**: Determines which callback type to use based on flow name

## Testing

To verify the fix works:

1. Start on Authorization Code flow - should show `/authz-callback`
2. Switch to Implicit flow - should automatically update to `/implicit-callback`
3. Switch to Hybrid flow - should automatically update to `/hybrid-callback`
4. Switch to Device Code flow - should automatically update to `/device-code-status`
5. Switch back to Authorization Code - should return to `/authz-callback`

## Educational Tool Behavior

PKCE codes are NO LONGER auto-generated or auto-restored. Users must:
1. Navigate to Step 1 (PKCE Parameters)
2. Click "Generate PKCE Parameters" button
3. See the generated codes
4. Proceed to next steps

This ensures users understand the PKCE flow and learn by doing.
