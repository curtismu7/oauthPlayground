# Clear Browser Cache to See New Sidebar Colors

## Issue
The sidebar V6 flow highlighting is not showing the new dark green colors even though the CSS has been updated.

## Root Cause
Browser is caching the old CSS styles. Even with HMR (Hot Module Replacement), sometimes CSS changes require a hard refresh.

## Solution - Try in Order:

### 1. Hard Refresh (Try First)
**Chrome/Edge:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Safari:**
- Mac: `Cmd + Option + R`

---

### 2. Clear Browser Cache (If Hard Refresh Doesn't Work)

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Right-click the refresh button (with DevTools open)
3. Select "Empty Cache and Hard Reload"

**Firefox:**
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached Web Content"
3. Click "Clear Now"
4. Refresh the page with `Ctrl+Shift+R` or `Cmd+Shift+R`

**Safari:**
1. Go to Safari menu → Preferences → Advanced
2. Check "Show Develop menu in menu bar"
3. Go to Develop menu → Empty Caches
4. Refresh with `Cmd+Option+R`

---

### 3. Clear Service Worker Cache (For PWA)
If the app is using a service worker:

1. Open DevTools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Service Workers** on the left
4. Click **Unregister** next to the service worker
5. Click **Clear storage** or **Clear site data**
6. Refresh the page

---

### 4. Incognito/Private Mode (Quick Test)
Open the app in an incognito/private window:
- Chrome/Edge: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- Firefox: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- Safari: `Cmd+Shift+N`

If colors work in incognito mode, it confirms it's a caching issue.

---

## Expected Colors After Cache Clear

### V6 Flow Menu Items:

**Default State:**
- Background: Dark green (#047857 - emerald-700)
- Border-left: 4px solid #059669 (emerald-600)
- Text: White (#ffffff)

**Hover State:**
- Background: Light green (#dcfce7)
- Text: Dark green (#15803d)
- Slight transform and shadow

**Active/Selected State:**
- Background: Very dark green (#064e3b - emerald-900)
- Border-left: 4px solid #10b981 (emerald-500)
- Border-right: 4px solid #10b981 (emerald-500)
- Text: White (#ffffff)
- Larger transform and shadow

---

## Dev Server Status

The dev server has been restarted to ensure the latest CSS is being served.

If you're still seeing old colors:
1. Check the Network tab in DevTools
2. Look for the CSS file being loaded
3. Verify it's not loading from cache (should say "200" not "304")
4. If it shows "from disk cache" or "from memory cache", force refresh

---

## Quick Verification

After clearing cache, you should see:
- ✅ V6 flow items with **dark green background** by default
- ✅ **Light green background** when hovering
- ✅ **Very dark green background** when selected (active)
- ✅ Green borders (not red)

If you still see red highlighting or light gray, the cache needs to be cleared more aggressively (try Method 3).

