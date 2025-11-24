# Flow-Specific Settings Implementation

## Summary

Each OAuth flow type now has its own isolated storage for settings, allowing users to maintain different configurations for each flow.

## What's Stored Per Flow

Each flow type (`oauth-authz`, `implicit`, `client-credentials`, `ropc`, `device-code`, `hybrid`) stores:

1. **Spec Version** - OAuth 2.0, OAuth 2.1, or OIDC
2. **Last Used Timestamp** - For tracking which flow was used most recently
3. **UI Preferences** (optional) - Like collapsed sections

## Storage Keys

- `v8u_flow_settings_oauth-authz` - Authorization Code flow settings
- `v8u_flow_settings_implicit` - Implicit flow settings
- `v8u_flow_settings_client-credentials` - Client Credentials flow settings
- `v8u_flow_settings_ropc` - ROPC flow settings
- `v8u_flow_settings_device-code` - Device Code flow settings
- `v8u_flow_settings_hybrid` - Hybrid flow settings

## User Experience

### Before
- All flows shared the same spec version
- Switching flows would lose your spec version preference
- Resetting a flow might lose settings

### After
- Each flow remembers its own spec version
- Switch between flows freely - each maintains its own settings
- Reset flow preserves spec version and credentials for that flow type

### Example Workflow

1. **User selects Implicit Flow**
   - Loads Implicit flow's saved spec version (e.g., OAuth 2.0)
   - Loads Implicit flow's saved credentials

2. **User changes spec to OAuth 2.1**
   - Saves OAuth 2.1 for Implicit flow only
   - Other flows keep their own spec versions

3. **User switches to Authorization Code Flow**
   - Loads Authorization Code flow's spec version (might be different!)
   - Loads Authorization Code flow's credentials

4. **User switches back to Implicit Flow**
   - Loads OAuth 2.0 (previously saved)
   - Loads Implicit flow's credentials

5. **User resets Implicit Flow**
   - Clears OAuth tokens and flow state
   - Preserves spec version (OAuth 2.0)
   - Preserves credentials

## Implementation Details

### Service: `FlowSettingsServiceV8U`

Located at: `src/v8u/services/flowSettingsServiceV8U.ts`

**Key Methods:**
- `loadSettings(flowType)` - Load settings for a flow
- `saveSettings(flowType, settings)` - Save settings for a flow
- `getSpecVersion(flowType)` - Get spec version for a flow
- `saveSpecVersion(flowType, specVersion)` - Save spec version for a flow
- `getAllSettings()` - Get all flow settings (debugging)
- `clearAllSettings()` - Clear all flow settings
- `getMostRecentFlow()` - Get the most recently used flow type

### Integration: `UnifiedOAuthFlowV8U`

**On Mount:**
- Loads spec version from flow-specific settings
- Updates last used timestamp

**On Flow Type Change:**
- Loads spec version for the new flow type
- Updates last used timestamp

**On Spec Version Change:**
- Saves spec version for current flow type

**On Reset:**
- Preserves spec version and credentials
- Only clears OAuth tokens and flow state

## Debug Commands

Available in browser console:

```javascript
// View all flow settings
FlowSettingsServiceV8U.getAllSettings()

// Get spec version for a specific flow
FlowSettingsServiceV8U.getSpecVersion('implicit')

// Save spec version for a flow
FlowSettingsServiceV8U.saveSpecVersion('implicit', 'oauth2.1')

// Clear all flow settings
FlowSettingsServiceV8U.clearAllSettings()

// Get most recently used flow
FlowSettingsServiceV8U.getMostRecentFlow()
```

## Files Modified

1. **Created:**
   - `src/v8u/services/flowSettingsServiceV8U.ts` - Settings service

2. **Modified:**
   - `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` - Integrated settings service

## Benefits

✅ **Better UX** - Each flow maintains its own configuration
✅ **No Confusion** - Switching flows doesn't lose settings
✅ **Flexibility** - Test different specs for different flows simultaneously
✅ **Persistence** - Settings survive page refreshes and resets
✅ **Debugging** - Easy to inspect and clear settings via console

## Future Enhancements

Possible additions to flow-specific settings:
- UI preferences (collapsed sections, expanded details)
- Favorite/pinned flows
- Flow-specific notes or descriptions
- Custom flow names
- Flow usage statistics

---

**Last Updated:** 2024-11-19
**Version:** 1.0.0
**Status:** Active - All V8U OAuth flows use this service
