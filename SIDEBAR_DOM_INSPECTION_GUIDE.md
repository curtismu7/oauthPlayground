# Sidebar DOM Inspection Guide

## Issue Identified
✅ **CSS is working correctly** - the test page shows green buttons  
❌ **react-pro-sidebar CSS is overriding our styles** - need to target the correct classes

## Next Steps

### 1. Inspect the Sidebar DOM
1. Open DevTools (F12)
2. Go to Elements tab
3. Right-click on a V6 menu item (like "Authorization Code (V6)")
4. Select "Inspect Element"
5. Look for the actual HTML structure and CSS classes

### 2. What to Look For
The menu item structure might look like:
```html
<button class="ps-menu-button v6-flow ps-active" style="...">
  <!-- menu content -->
</button>
```

### 3. Check Computed Styles
1. In the Elements tab, click on the menu button element
2. Look at the "Styles" panel on the right
3. See which CSS rules are being applied
4. Look for any rules with higher specificity that are overriding our styles

### 4. Common Issues with react-pro-sidebar
- The library might be using CSS-in-JS or styled-components
- It might have inline styles that override CSS
- The class names might be different than expected
- There might be CSS specificity conflicts

### 5. Potential Solutions to Try

#### A. Target More Specific Classes
If the actual class is different, update our CSS:
```css
/* Instead of */
.ps-sidebar .ps-menu-button.v6-flow

/* Try */
.ps-sidebar .ps-menu-button.v6-flow.ps-menu-button
/* or */
[class*="ps-menu-button"].v6-flow
```

#### B. Use CSS Custom Properties
Add CSS variables that can override inline styles:
```css
.ps-sidebar .ps-menu-button.v6-flow {
  --ps-menu-button-bg: #047857 !important;
  --ps-menu-button-color: #ffffff !important;
  background: var(--ps-menu-button-bg) !important;
  color: var(--ps-menu-button-color) !important;
}
```

#### C. Apply Inline Styles to All V6 Items
Since we know inline styles work, apply them to all V6 menu items.

### 6. Test Results
Once you inspect the DOM, we can:
1. Update the CSS selectors to match the actual DOM structure
2. Apply inline styles as a fallback
3. Use CSS custom properties to override library styles

## Expected DOM Structure
The menu items should have classes like:
- `ps-menu-button` (from react-pro-sidebar)
- `v6-flow` (our custom class)
- `ps-active` (when selected)

Let me know what you find in the DOM inspection!
