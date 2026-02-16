# Redirect URI Improvements - Summary

## Changes Made

### 1. Separated Worker Token from Client Credentials Callbacks

**Problem:** Worker Token and Client Credentials flows were using the same callback URI (`/worker-token-callback`).

**Solution:**
- Added separate `clientCredentialsCallback` and `clientCredentialsLogoutCallback` to `FlowCallbackUris` interface
- Updated `callbackUriService.ts` to distinguish between the two flows:
  - `worker-token` → `/worker-token-callback`
  - `client-credentials` → `/client-credentials-callback`
- Updated `getCallbackTypesForFlow()` to check for `worker-token` FIRST (more specific), then `client-credentials`

**Files Modified:**
- `src/services/callbackUriService.ts`
- `src/utils/flowRedirectUriMapping.ts`

### 2. Added V8U Flow Mappings

Added complete redirect URI mappings for all V8U flows:

| Flow Type | Redirect URI | Required |
|-----------|-------------|----------|
| `oauth-authz-v8u` | `/authz-callback` | Yes |
| `implicit-v8u` | `/implicit-callback` | Yes |
| `hybrid-v8u` | `/hybrid-callback` | Yes |
| `device-code-v8u` | `/device-code-status` | No |
| `client-credentials-v8u` | `/client-credentials-callback` | No |
| `ropc-v8u` | N/A | No |

Also added generic fallbacks for:
- `device-code` → `/device-code-status`
- `ropc` → N/A

### 3. Added Link to Setup Page from Credentials Form

**Feature:** Users can now click a link in the credentials form to view all redirect URIs.

**Implementation:**
- Added a helpful link below the Redirect URI input field
- Link text: "View all redirect URIs in Setup page"
- Link format: `/configuration#redirect-uri-catalog-{flowType}`
- Styled with hover effect (underline on hover)

**Location:** `src/v8u/components/CredentialsFormV8U.tsx` (line ~2320)

### 4. Added Hash Navigation and Row Highlighting

**Feature:** When users click the link, they're taken directly to the specific flow row in the Setup page table.

**Implementation:**

#### A. Added IDs to Table Elements
- Added `id="redirect-uri-catalog"` to the CollapsibleHeader
- Added `id="redirect-uri-catalog-{flowType}"` to each UriRow
- Added `scrollMarginTop: '100px'` to prevent header overlap

#### B. Added Hash Navigation Effect
- Listens for hash changes in URL
- Scrolls smoothly to the target row
- Highlights the row with yellow background (#fef3c7) for 2 seconds
- Works on initial page load and when hash changes

**Location:** `src/pages/Configuration.tsx`

## User Experience Flow

1. User is on a V8U flow page (e.g., Authorization Code)
2. User sees the Redirect URI field in the credentials form
3. Below the field, they see: "💡 View all redirect URIs in Setup page"
4. User clicks the link
5. Browser navigates to `/configuration#redirect-uri-catalog-oauth-authz-v8u`
6. Page scrolls smoothly to the specific row for that flow type
7. Row highlights in yellow for 2 seconds to draw attention
8. User can see the correct redirect URI and copy it

## Technical Details

### Hash Format
```
/configuration#redirect-uri-catalog-{flowType}
```

Examples:
- `/configuration#redirect-uri-catalog-oauth-authz-v8u`
- `/configuration#redirect-uri-catalog-implicit-v8u`
- `/configuration#redirect-uri-catalog-hybrid-v8u`

### Scroll Behavior
- Uses `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- 300ms delay to ensure DOM is rendered
- `scrollMarginTop: '100px'` prevents header overlap

### Highlight Animation
- Background color: `#fef3c7` (light yellow)
- Duration: 2 seconds
- Smooth transition: `transition: 'background-color 0.3s ease'`

## Benefits

1. **Discoverability:** Users can easily find all redirect URIs in one place
2. **Context:** Link is shown right where users need it (next to redirect URI field)
3. **Precision:** Takes users directly to the relevant flow row
4. **Visual Feedback:** Highlighting ensures users see the correct row
5. **Separation:** Worker Token and Client Credentials now have distinct callbacks
6. **Completeness:** All V8U flows are properly mapped

## Testing

To test the feature:

1. Navigate to any V8U flow (e.g., `/v8u/unified/oauth-authz/0`)
2. Look at the Redirect URI field in the credentials form
3. Click "View all redirect URIs in Setup page"
4. Verify you're taken to the Setup page
5. Verify the page scrolls to the correct flow row
6. Verify the row highlights in yellow briefly
7. Verify the redirect URI matches what's shown in the form

## Future Enhancements

Possible improvements:
- Add similar links for other fields (logout URI, scopes, etc.)
- Add a "Copy" button directly in the credentials form
- Show a preview of all URIs for the current flow in a tooltip
- Add validation that checks if the URI matches PingOne configuration
