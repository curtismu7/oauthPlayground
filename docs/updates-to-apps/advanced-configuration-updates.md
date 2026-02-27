# Advanced Configuration Page Updates

**Page:** Advanced Configuration (`/advanced-configuration`)  
**Last Updated:** 2026-02-27  
**Owner:** OAuth Playground Team

---

## Change Log

### 2026-02-27: Route Fix and Back to Dashboard Button

#### Summary

Fixed 404 error on `/advanced-configuration` route and added "Back to Dashboard" button for better navigation.

#### Scope

**Files Touched:**
- `src/App.tsx` - Route definition
- `src/pages/AdvancedConfiguration.tsx` - Back button

#### Compatibility

**Classification:** PATCH (no breaking changes)

**Rationale:**
- Route mismatch fix (internal)
- UI enhancement (back button)
- No API or contract changes

#### Changes Made

**1. Route Fix (src/App.tsx):**

Before:
```tsx
<Route path="/advanced-config" element={<AdvancedConfiguration />} />
```

After:
```tsx
<Route path="/advanced-configuration" element={<AdvancedConfiguration />} />
```

**Issue:** Sidebar menu linked to `/advanced-configuration` but App.tsx route was `/advanced-config`, causing 404 redirect to dashboard.

**Root Cause:** Route mismatch between:
- Sidebar: `path: '/advanced-configuration'` (DragDropSidebar.tsx line 1556)
- PageStyleContext: `/advanced-configuration` (line 93)
- sidebarMenuConfig: `/advanced-configuration` (line 63)
- BUT App.tsx had: `/advanced-config` ❌

**2. Back to Dashboard Button (src/pages/AdvancedConfiguration.tsx):**

Added imports:
```tsx
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
```

Added styled component:
```tsx
const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #4b5563;
    transform: translateX(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateX(0);
  }
`;
```

Added to JSX (after FlowHeader):
```tsx
<BackButton onClick={() => navigate('/')} aria-label="Back to Dashboard">
  <FiArrowLeft />
  Back to Dashboard
</BackButton>
```

**User Benefit:** Users can easily return to Dashboard after accessing Advanced Configuration from Dashboard.

#### Testing

**How to Verify:**

1. Navigate to https://api.pingdemo.com:3000/
2. Click on "Advanced Configuration" link (from Dashboard or sidebar)
3. Verify page loads without 404 redirect
4. Verify "Back to Dashboard" button appears below header
5. Click "Back to Dashboard" button
6. Verify navigation to Dashboard (/)

**Expected Behavior:**
- ✅ URL `/advanced-configuration` loads without 404
- ✅ Back button appears with left arrow icon
- ✅ Hover effect: button darkens and slides left slightly
- ✅ Click navigates to Dashboard

#### Files Modified

- `src/App.tsx` (1728 lines)
  - Line 1308: Changed route from `/advanced-config` → `/advanced-configuration`
- `src/pages/AdvancedConfiguration.tsx` (996 lines)
  - Lines 1-2: Added useNavigate import
  - Lines 4-16: Added FiArrowLeft import
  - Lines 240-265: Added BackButton styled component
  - Line 324: Added navigate = useNavigate()
  - Lines 580-588: Added BackButton JSX

#### Rollback Plan

**If issues occur:**

1. **Revert route:**
   ```tsx
   // Restore old route (causes 404, but matches old behavior)
   <Route path="/advanced-config" element={<AdvancedConfiguration />} />
   ```

2. **Remove back button:**
   - Remove BackButton styled component
   - Remove useNavigate hook
   - Remove FiArrowLeft import
   - Remove BackButton JSX

3. **Quick git revert:**
   ```bash
   git revert <commit-hash>
   ```

#### Related Issues

**Previous Documentation:**
- Issue was previously documented in `docs/migration/migrate_cursor.md` lines 161-185
- Route was corrected before but appears to have been reverted
- This fix aligns all route references

**Consistency Check:**
- ✅ Sidebar: `/advanced-configuration`
- ✅ PageStyleContext: `/advanced-configuration`
- ✅ sidebarMenuConfig: `/advanced-configuration`
- ✅ App.tsx: `/advanced-configuration` ← Fixed

---

## Page Overview

### Advanced Configuration

**Path:** `/advanced-configuration`  
**Sidebar:** Developer Tools → Advanced Configuration

**Purpose:** Configure PingOne default settings for Environment ID, Redirect URI, and OAuth scopes that are used across all flows.

**Key Features:**
- Environment ID default configuration
- Redirect URI default configuration
- Standard OAuth scope selection (openid, profile, email, etc.)
- Custom scope addition
- Custom claim configuration
- JSON configuration preview
- Code snippet generation
- Save defaults to credentialManager

**Storage:**
- Uses `credentialManager.saveAuthzFlowCredentials()` (localStorage)
- Stores: environmentId, redirectUri, scope (space-separated)
- Auto-loads worker token credentials as fallback

**Layout:**
- Uses PageLayoutService with FlowHeader
- Collapsible sections
- Responsive grid layout
- JSON editor integration

---

## Navigation

**Entry Points:**
- Sidebar: Developer Tools → Advanced Configuration
- Direct URL: `/advanced-configuration`
- Dashboard: (potential quick link)

**Exit Points:**
- Back to Dashboard button (new)
- Sidebar navigation
- Browser back button

---

## Future Improvements

- [ ] Add link to Advanced Configuration from Dashboard Quick Access
- [ ] Migrate from credentialManager to unified storage (IndexedDB + SQLite)
- [ ] Add "Recently Used" environment IDs dropdown
- [ ] Add validation for Environment ID format (UUID)
- [ ] Add "Test Configuration" button to verify credentials
- [ ] Add export/import configuration feature

---
