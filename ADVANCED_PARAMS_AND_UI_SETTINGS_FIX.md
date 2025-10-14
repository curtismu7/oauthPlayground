# Advanced Parameters & UI Settings Fix

**Date:** October 11, 2025  
**Issue 1:** "And we loose V5stepper when we go to page 2" (Advanced Parameters)  
**Issue 2:** "still no header" (Advanced Parameters collapsible sections)  
**Issue 3:** `Uncaught ReferenceError: uiSettings is not defined` (OIDCAuthorizationCodeFlowV6)

---

## 🐛 Problems Fixed

### 1. **Advanced Parameters Page - Missing V5 Stepper**
- **File:** `src/pages/flows/AdvancedParametersV6.tsx`
- **Problem:** V5 stepper disappeared when navigating to Advanced Parameters page
- **Solution:** Added `FlowSequenceDisplay` component and "Back to Flow" button

### 2. **Advanced Parameters Page - Collapsible Headers**
- **File:** `src/pages/flows/AdvancedParametersV6.tsx`
- **Problem:** Using local styled components instead of `CollapsibleHeader` service
- **Solution:** Migrated all sections to use `CollapsibleHeader` service
- **Default State:** Changed all sections to start **collapsed** (matching user expectations)

### 3. **OIDC Authorization Code Flow - Missing uiSettings**
- **File:** `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`
- **Problem:** `uiSettings` variable used but `useUISettings` hook not called
- **Solution:** Added `useUISettings` hook import and usage

---

## ✅ Changes Made

### File: `src/pages/flows/AdvancedParametersV6.tsx`

#### **1. Added V5 Stepper**
```typescript
{/* V5 Stepper - Show flow sequence */}
<FlowSequenceDisplay flowType="authorization-code" />
```

#### **2. Added Back Navigation**
```typescript
<BackButton onClick={handleBackToFlow}>
    <FiArrowLeft />
    Back to {getFlowTitle()}
</BackButton>
```

#### **3. Migrated to CollapsibleHeader Service**

**Removed Local Components:**
- `CollapsibleSection`
- `CollapsibleHeaderButton`
- `CollapsibleTitle`
- `CollapsibleToggleIcon`
- `CollapsibleContent`
- `SectionDivider`

**Added Import:**
```typescript
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
```

**Migrated 5 Sections:**

1. **Advanced Claims Request Builder** (OIDC only)
```typescript
<CollapsibleHeader
    title="Advanced Claims Request Builder"
    icon={<FiCode />}
    defaultCollapsed={true}  // ✅ Starts collapsed
>
    <ClaimsRequestBuilder value={claimsRequest} onChange={setClaimsRequest} />
</CollapsibleHeader>
```

2. **Display Parameter** (OIDC only)
```typescript
<CollapsibleHeader
    title="Display Parameter (OIDC)"
    icon={<FiGlobe />}
    defaultCollapsed={true}  // ✅ Starts collapsed
>
    <DisplayParameterSelector value={displayMode as any} onChange={setDisplayMode} />
</CollapsibleHeader>
```

3. **Resource Indicators (RFC 8707)**
```typescript
<CollapsibleHeader
    title="Resource Indicators (RFC 8707)"
    icon={<FiShield />}
    defaultCollapsed={true}  // ✅ Starts collapsed
>
    <InfoBox>...</InfoBox>
    <ResourceParameterInput value={resources} onChange={setResources} />
</CollapsibleHeader>
```

4. **Enhanced Prompt Parameter**
```typescript
<CollapsibleHeader
    title="Enhanced Prompt Parameter"
    icon={<FiSettings />}
    defaultCollapsed={true}  // ✅ Starts collapsed
>
    <InfoBox>...</InfoBox>
    <EnhancedPromptSelector value={promptValues as any} onChange={setPromptValues} />
</CollapsibleHeader>
```

5. **Audience Parameter**
```typescript
<CollapsibleHeader
    title="Audience Parameter"
    icon={<FiShield />}
    defaultCollapsed={true}  // ✅ Starts collapsed
>
    <InfoBox>...</InfoBox>
    <AudienceParameterInput value={audience} onChange={setAudience} />
</CollapsibleHeader>
```

#### **4. Changed Default Collapsed States**
```typescript
// Before: All expanded (false)
const collapsedSections = {
    claims: false,
    resource: false,
    prompt: false,
    display: false,
    audience: false,
    education: false
};

// After: All collapsed (true)
const collapsedSections = {
    claims: true,    // ✅ User clicks to expand
    resource: true,   // ✅ User clicks to expand
    prompt: true,     // ✅ User clicks to expand
    display: true,    // ✅ User clicks to expand
    audience: true,   // ✅ User clicks to expand
    education: true   // ✅ User clicks to expand
};
```

---

### File: `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`

#### **1. Added Missing Import**
```typescript
import { useUISettings } from '../../contexts/UISettingsContext';
```

#### **2. Added useUISettings Hook**
```typescript
// UI Settings
const { settings: uiSettings } = useUISettings();
```

**Location:** Line 622 (after `usePageScroll`, before `useId`)

**Used in:**
- Line 984: Conditional modal display check
- Line 996: useEffect dependency array

---

## 📊 Comparison: OAuth vs OIDC Authorization Code Flows

Both flows now have **consistent** UI settings usage:

### OAuth Authorization Code Flow ✅
```typescript
// src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx
import { useUISettings } from '../../contexts/UISettingsContext';

const OAuthAuthorizationCodeFlowV6: React.FC = () => {
    const { settings: uiSettings } = useUISettings();  // ✅ Consistent
    // ... rest of component
```

### OIDC Authorization Code Flow ✅ (FIXED)
```typescript
// src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx
import { useUISettings } from '../../contexts/UISettingsContext';

const OIDCAuthorizationCodeFlowV6: React.FC = () => {
    const { settings: uiSettings } = useUISettings();  // ✅ Now consistent
    // ... rest of component
```

---

## 🎯 User Experience Improvements

### Advanced Parameters Page

**Before:**
- ❌ No V5 stepper (lost visual context)
- ❌ No easy way back to main flow
- ❌ Inconsistent collapsible sections (local components)
- ❌ All sections expanded by default (overwhelming)
- ❌ Headers not rendering properly

**After:**
- ✅ V5 stepper visible (maintains visual context)
- ✅ "Back to Flow" button with dynamic flow name
- ✅ Consistent blue headers with white arrow icons
- ✅ All sections collapsed by default (clean, focused)
- ✅ Headers render properly
- ✅ Smooth collapse/expand animations
- ✅ Centralized styling via `CollapsibleHeader` service

### OIDC Authorization Code Flow

**Before:**
- ❌ App crashes with `ReferenceError: uiSettings is not defined`
- ❌ Cannot use the flow at all

**After:**
- ✅ Flow works correctly
- ✅ UI settings properly loaded
- ✅ Modal behavior controlled by settings
- ✅ Consistent with OAuth flow

---

## 🔍 Is AdvancedParametersV6 a Reusable Service?

**Answer: NO**

`AdvancedParametersV6` is a **standalone page component**, not a reusable service.

### How It Works:
1. **Route:** `/flows/:flowType/advanced-parameters`
2. **Navigation:** Via `AdvancedParametersNavigation` button component
3. **Usage:** User clicks "Configure Advanced Parameters" button → navigates to full page
4. **Props:** Accepts optional callbacks for parameter changes

### Key Characteristics:
- Full-page layout with `Container` and `Content` wrappers
- Uses `useParams` to determine which flow it was called from
- Has its own routing and navigation
- Not embedded within other flows

### Example Usage in Flows:
```typescript
// OAuth/OIDC Authorization Code flows
<AdvancedParametersNavigation flowType="oauth-authorization-code" />
```

This renders a button that navigates to: `/flows/oauth-authorization-code/advanced-parameters`

---

## 🎨 Styling Consistency

All collapsible sections now use:
- **Header Background:** Blue gradient (`#3b82f6` to `#2563eb`)
- **Arrow Icon:** White circle with blue background
- **Content Area:** White background with padding
- **Border:** Light gray (`#e2e8f0`)
- **Shadow:** Subtle box shadow (`0 10px 20px rgba(15, 23, 42, 0.05)`)
- **Hover Effects:** Darker blue gradient
- **Transitions:** Smooth 0.2s animations
- **Default State:** Collapsed (user clicks to expand)

---

## 📝 Code Reduction

### Advanced Parameters Page:
- **Before:** ~410 lines (with local styled components)
- **After:** ~296 lines (using CollapsibleHeader service)
- **Reduction:** ~114 lines (28% smaller)
- **Deleted Components:** 5 local styled components

### Lines Saved:
```typescript
// Removed ~50 lines of styled component definitions
// Removed ~60 lines of manual JSX collapsible structure
// Added ~5 lines for CollapsibleHeader import and usage
```

---

## 🧪 Testing Checklist

### Advanced Parameters Page:
- [x] V5 stepper displays on page load
- [x] "Back to Flow" button works
- [x] All sections start collapsed
- [x] Clicking section header expands/collapses
- [x] Blue headers with white arrow icons visible
- [x] Arrow rotates on expand/collapse
- [x] Content displays correctly when expanded
- [x] OIDC-specific sections only show for OIDC flows
- [x] OAuth-specific sections only show for OAuth flows

### OIDC Authorization Code Flow:
- [x] Flow loads without errors
- [x] `uiSettings` is defined
- [x] Modal behavior works correctly
- [x] useEffect with `uiSettings.showAuthRequestModal` doesn't crash

---

**Status:** ✅ **ALL ISSUES FIXED**  
**Files Changed:** 2  
**Lines Changed:** ~150  
**Errors Fixed:** 1 critical error (ReferenceError)  
**UX Improvements:** 5 major improvements

