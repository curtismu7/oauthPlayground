# Browser Cache Clearing Guide

This guide provides various methods to clear browser cache for development and testing purposes.

## Quick Methods (Recommended for Development)

### Hard Refresh
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **Effect**: Clears cache and reloads page with fresh resources

### Developer Tools Method
1. Open Developer Tools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## JavaScript Console Commands

### Clear All Storage
```javascript
// Clear localStorage
localStorage.clear();
console.log("localStorage cleared");

// Clear sessionStorage  
sessionStorage.clear();
console.log("sessionStorage cleared");

// Reload page after clearing
location.reload();
```

### Clear OAuth Playground Specific Data
```javascript
// Clear OAuth Playground specific storage
localStorage.removeItem('pingone_worker_flow_credentials');
localStorage.removeItem('pingone_permanent_credentials');
localStorage.removeItem('pingone_session_credentials');
localStorage.removeItem('enhanced-flow-worker-token-v3');
sessionStorage.clear();
console.log("OAuth Playground cache cleared");
```

### Clear IndexedDB (if needed)
```javascript
// Clear IndexedDB (for thorough cleanup)
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
    console.log("IndexedDB cleared");
  });
}
```

## Manual Browser Settings

### Chrome
1. Settings → Privacy and Security → Clear browsing data
2. Select "Cached images and files"
3. Choose time range (e.g., "Last hour" for development)
4. Click "Clear data"

### Firefox
1. Settings → Privacy & Security → Clear Data
2. Select "Cached Web Content"
3. Click "Clear"

### Edge
1. Settings → Privacy, search, and services → Clear browsing data
2. Select "Cached images and files"
3. Click "Clear now"

## Browser Shortcuts

### General Cache Clear
- **Chrome/Edge**: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Firefox**: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Safari**: `Cmd+Option+E` (Mac)

### Hard Refresh (Cache Bypass)
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

## Testing Methods

### Incognito/Private Mode
Open a new incognito/private window to test without any cached data:
- **Chrome**: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- **Firefox**: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)

### Disable Cache (Developer Tools)
1. Open Developer Tools (`F12`)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Keep DevTools open while testing

## Common Use Cases

### Development Testing
- Use **Hard Refresh** (`Ctrl+Shift+R`) for quick cache clearing
- Use **Incognito Mode** for clean testing environment

### OAuth Playground Testing
- Clear specific localStorage items to reset flow state
- Use hard refresh to ensure latest code changes are loaded

### Production Issues
- Clear all cache and cookies
- Test in incognito mode to isolate cache-related issues

## Notes

- `chrome.browsingData.remove()` API is only available in Chrome extensions, not regular web pages
- Hard refresh is usually the most effective method for development
- Incognito mode provides the cleanest testing environment
- Some applications may store data in IndexedDB or other storage mechanisms

## Troubleshooting

If cache clearing doesn't work:
1. Try incognito mode
2. Check if service workers are caching resources
3. Verify the application isn't using other storage mechanisms
4. Try a different browser
5. Restart the browser completely
