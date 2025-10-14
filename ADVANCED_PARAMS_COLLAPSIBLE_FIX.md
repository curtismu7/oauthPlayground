# Advanced Parameters Page - CollapsibleHeader Migration

**Date:** October 11, 2025  
**Issue:** "still no header" - Advanced Parameters page collapsible sections not showing headers properly  
**File:** `src/pages/flows/AdvancedParametersV6.tsx`

## 🐛 The Problem

The user reported that after navigating to page 2 (Advanced Parameters):
1. The V5 stepper disappeared
2. The collapsible section headers were not showing properly

## 🔍 Root Cause

The Advanced Parameters page was using **local styled components** for collapsible sections instead of the centralized `CollapsibleHeader` service. This resulted in:
- Inconsistent styling compared to other flows
- Missing or improperly rendered headers
- Different collapsing behavior

## ✅ The Solution

### 1. Added V5 Stepper
```typescript
<FlowSequenceDisplay flowType="authorization-code" />
```
- Now shows flow context on Advanced Parameters page
- User doesn't lose visual reference

### 2. Added Back Button
```typescript
<BackButton onClick={handleBackToFlow}>
    <FiArrowLeft />
    Back to {getFlowTitle()}
</BackButton>
```
- Easy navigation back to main flow
- Shows dynamic flow name

### 3. Migrated to CollapsibleHeader Service
**Before:** Local styled components
```typescript
<CollapsibleSection>
    <CollapsibleHeaderButton onClick={() => toggleCollapsed('claims')}>
        <CollapsibleTitle>
            <FiCode /> Advanced Claims Request Builder
        </CollapsibleTitle>
        <CollapsibleToggleIcon $collapsed={collapsedSections.claims}>
            <FiChevronDown />
        </CollapsibleToggleIcon>
    </CollapsibleHeaderButton>
    {!collapsedSections.claims && (
        <CollapsibleContent>
            {/* content */}
        </CollapsibleContent>
    )}
</CollapsibleSection>
```

**After:** CollapsibleHeader service
```typescript
<CollapsibleHeader
    title="Advanced Claims Request Builder"
    icon={<FiCode />}
    defaultCollapsed={collapsedSections.claims}
>
    {/* content */}
</CollapsibleHeader>
```

## 📝 Changes Made

### File: `src/pages/flows/AdvancedParametersV6.tsx`

#### 1. **Added Imports:**
```typescript
import { FiArrowLeft } from 'react-icons/fi';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { useNavigate } from 'react-router-dom';
```

#### 2. **Removed Local Styled Components:**
- `CollapsibleSection`
- `CollapsibleHeaderButton`
- `CollapsibleTitle`
- `CollapsibleToggleIcon`
- `CollapsibleContent`
- `SectionDivider`
- Removed unused `FiChevronDown` import

#### 3. **Migrated 5 Collapsible Sections:**

1. **Advanced Claims Request Builder** (OIDC only)
   - Icon: `<FiCode />`
   - Default: Collapsed

2. **Display Parameter** (OIDC only)
   - Icon: `<FiGlobe />`
   - Default: Collapsed

3. **Resource Indicators (RFC 8707)**
   - Icon: `<FiShield />`
   - Default: Collapsed
   - Includes InfoBox with explanation

4. **Enhanced Prompt Parameter**
   - Icon: `<FiSettings />`
   - Default: Collapsed
   - Includes InfoBox with OIDC note

5. **Audience Parameter**
   - Icon: `<FiShield />`
   - Default: Collapsed
   - Includes InfoBox

#### 4. **Simplified State Management:**
- Changed `useState` to const object (since `CollapsibleHeader` manages its own state)
- Removed unused `toggleCollapsed` function
- Removed unused `setCollapsedSections`

#### 5. **Added Navigation:**
```typescript
const handleBackToFlow = () => {
    navigate(`/flows/${actualFlowType}`);
};
```

## 🎯 User Experience Improvements

### Before:
- ❌ No V5 stepper on Advanced Parameters page
- ❌ Inconsistent headers (local styling)
- ❌ No easy way back to main flow
- ❌ Headers not rendering properly

### After:
- ✅ V5 stepper visible on Advanced Parameters page
- ✅ Consistent blue headers with white arrow icons
- ✅ "Back to Flow" button with flow name
- ✅ All headers render properly
- ✅ Smooth collapse/expand animations
- ✅ Centralized styling and behavior

## 🔧 Technical Details

### CollapsibleHeader Props Used:
```typescript
interface CollapsibleHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  showArrow?: boolean;
  variant?: 'default' | 'compact' | 'large';
  theme?: 'blue' | 'green' | 'orange' | 'purple';
  children: React.ReactNode;
  className?: string;
}
```

### Internal State Management:
- `CollapsibleHeader` uses internal `useState` for collapsed state
- No need for parent component to manage state
- `defaultCollapsed` prop sets initial state only

### Default Collapsed States (All False):
- `claims`: `false` (expanded by default)
- `resource`: `false` (expanded by default)
- `prompt`: `false` (expanded by default)
- `display`: `false` (expanded by default)
- `audience`: `false` (expanded by default)
- `education`: `false` (expanded by default)

## 📊 Before/After Code Comparison

**Lines of Code:**
- **Before:** ~410 lines (with local styled components)
- **After:** ~300 lines (using CollapsibleHeader service)
- **Reduction:** ~110 lines (27% smaller)

**Styled Components:**
- **Before:** 5 local styled collapsible components
- **After:** 0 (using centralized service)

**Complexity:**
- **Before:** Manual state management, custom styling, conditional rendering
- **After:** Simple prop-based configuration, centralized behavior

## 🎨 Styling Consistency

All sections now use the same styling as other flows:
- **Header Background:** Blue gradient (`#3b82f6` to `#2563eb`)
- **Arrow Icon:** White circle with blue background
- **Content Area:** White background with padding
- **Border:** Light gray (`#e2e8f0`)
- **Shadow:** Subtle box shadow
- **Hover Effects:** Darker blue gradient
- **Transitions:** Smooth 0.2s animations

---

**Status:** ✅ **FIXED**  
**Headers now show properly on Advanced Parameters page!** 🎉  
**V5 Stepper now persists across navigation!** 🎉  
**Consistent styling across all flows!** 🎉

