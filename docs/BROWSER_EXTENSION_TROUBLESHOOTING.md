# Browser Extension Troubleshooting Guide

## Problem

You may see errors in the browser console like:
```
WebSocket connection to 'wss://api.pingdemo.com:3000/?token=...' failed
bootstrap-autofill-overlay.js:9562 Uncaught (in promise) TypeError: Cannot read properties of null (reading 'includes')
```

- **WebSocket** — Vite’s dev hot-reload (HMR) client tries to connect to `wss://api.pingdemo.com:3000`. With custom HTTPS or when HMR is disabled, the connection often fails. The app works without it; hot reload is only needed for local dev. **To stop the WebSocket attempt:** start the app with **`./scripts/development/run.sh`** (which sets `VITE_HMR_HOST` and disables HMR), or set **`VITE_DISABLE_HMR=1`** in `.env` and restart the dev server.
- **bootstrap-autofill-overlay / AutofillOverlayContentService** — A browser extension (e.g. password manager or autofill) is injecting a script that hits a null reference (`Cannot read properties of null (reading 'includes')`). It’s in the extension’s code, not the app.

The app **suppresses** these in the console (console.error/console.warn overrides and unhandledrejection handler) so they don’t clutter the console. You can ignore them or disable the extension on this site for a completely clean console.

## Solution

### Quick Fix

1. **Disable Browser Extensions Temporarily**
   - Open your browser's extension settings
   - Disable password managers and autofill extensions
   - Reload the page
   - Errors should disappear

2. **Alternative: Use Incognito/Private Mode**
   - Open the OAuth Playground in incognito mode
   - Most extensions are disabled by default in incognito

### Common Problematic Extensions

- **Password Managers**: LastPass, 1Password, Bitwarden, Dashlane
- **Autofill Tools**: Browser built-in autofill, form fillers
- **Development Tools**: Some developer extensions that modify page content

### Permanent Solution

The OAuth Playground now includes automatic error handling for browser extensions:

1. **Error Suppression**: Extension errors are caught and logged as warnings instead of crashing the app
2. **Visual Helper**: A notification appears when extension interference is detected
3. **Automatic Protection**: The app includes metadata and scripts to prevent extension interference

## Technical Details

### What's Happening

Browser extensions inject JavaScript into web pages to provide their functionality. Sometimes this injection:

1. **Attempts WebSocket connections** to external services
2. **Modifies form fields** causing null reference errors
3. **Interferes with React components** and state management

### How We Fixed It

1. **Error Boundary**: Added `ExternalScriptErrorBoundary` to catch and handle extension errors
2. **Console Filtering**: Override console methods to filter out extension noise
3. **HTML Metadata**: Added meta tags to disable extension behavior
4. **DOM Monitoring**: Monitor and remove extension-injected elements

### Code Changes

- `src/utils/errorBoundaryUtils.tsx`: Error boundary and suppression utilities
- `src/App.tsx`: Integrated error handling into the app
- `public/browser-extension-helper.js`: Client-side extension detection and helper UI
- `index.html`: Added extension prevention metadata and helper script

## Developer Notes

### Detecting Extension Issues

```javascript
// The app automatically detects extension errors
window.BrowserExtensionHelper.showExtensionHelper();

// Check for problematic extensions
const warnings = window.BrowserExtensionHelper.detectExtensions();
console.log('Extension warnings:', warnings);
```

### Adding New Extensions to Block List

Update `problematicExtensions` array in `browser-extension-helper.js`:

```javascript
const problematicExtensions = [
    'bootstrap-autofill-overlay',
    'lastpass',
    '1password',
    'bitwarden',
    'dashlane',
    'autofill',
    'password-manager',
    'new-extension-name' // Add here
];
```

### Error Patterns

The system catches these error patterns:
- `bootstrap-autofill-overlay`
- `WebSocket connection failed`
- `Cannot read properties of null (reading 'includes')`
- Any error from `extension://` sources

## User Experience

### Before Fix
- Console filled with extension errors
- Potential app crashes
- Confusing error messages

### After Fix
- Clean console (extension errors logged as warnings)
- Helpful notification when interference detected
- App continues working normally
- Clear troubleshooting guidance

## Testing

### Verify Extension Handling

1. Install a password manager extension
2. Navigate to the OAuth Playground
3. Check that:
   - No errors crash the app
   - Extension helper notification appears
   - Console shows warnings instead of errors
   - App functionality remains intact

### Disable Extension Handling

To test without extension handling:

```javascript
// Temporarily disable in browser console
window.BrowserExtensionHelper = undefined;
```

## Support

If you continue to experience issues:

1. **Try a different browser** (Chrome, Firefox, Safari, Edge)
2. **Clear browser cache and cookies**
3. **Check for conflicting extensions**
4. **Report the issue** with:
   - Browser name and version
   - Extensions you have installed
   - Console error messages
   - Steps to reproduce

---

**Note**: These fixes are designed to handle common extension interference while maintaining full application functionality. The OAuth Playground should work reliably regardless of browser extensions.
