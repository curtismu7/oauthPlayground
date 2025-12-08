# SMS Flow Simplification Plan

## Current Flow Analysis

**Current Steps (5 pages):**
1. **Step 0: Configure** - Credentials + Registration Flow Type selection
2. **Step 1: Select Device** - Choose existing device or register new
3. **Step 2: Register Device** - Modal with registration form (separate page)
4. **Step 3: Send OTP** - Separate page for sending/resending OTP
5. **Step 4: Validate OTP** - Modal for OTP validation

## Issues Identified

1. **Step 3 (Send OTP) is redundant** - OTP is automatically sent after registration for ACTIVATION_REQUIRED devices
2. **Step 1 and Step 2 are fragmented** - Device selection and registration are on separate pages
3. **Unnecessary navigation** - Users navigate through multiple pages for a single task

## Proposed Simplified Flow

**New Steps (3 pages):**

### Step 0: Configure (KEEP)
- Environment ID, Username, Worker Token
- Registration Flow Type (Admin/User)
- **Status:** No changes needed

### Step 1: Device Management (MERGE Steps 1 + 2)
**Combined functionality:**
- Show existing devices (if any)
- "Register New Device" button/option
- **Inline registration form** (not a separate page/modal)
  - Device type selector (SMS/EMAIL)
  - Phone number/Email input
  - Device name
  - Registration Flow Type (already set in Step 0, but show as read-only indicator)
- After registration:
  - **ACTIVE devices:** Show success message, stay on Step 1, refresh device list
  - **ACTIVATION_REQUIRED devices:** Auto-send OTP, show success message with "Validate OTP" button, navigate to Step 2

### Step 2: Validate OTP (CONDITIONAL - only for ACTIVATION_REQUIRED)
- OTP input field
- Validate button
- Resend OTP button (if needed)
- Success/error messages
- **Skip entirely for ACTIVE devices**

## Implementation Plan

### Phase 1: Remove Step 3 (Send OTP)
**Changes:**
- Remove `renderStep3` and `createRenderStep3()`
- Update `stepLabels` to remove "Send OTP"
- After registration with ACTIVATION_REQUIRED:
  - OTP is sent automatically (already happens)
  - Navigate directly to Step 2 (Validate OTP) instead of Step 3
  - Add "Resend OTP" button to Step 2 validation page

### Phase 2: Merge Steps 1 and 2
**Changes:**
- Combine device selection and registration into single Step 1
- Remove separate registration modal/page
- Add collapsible/expandable registration form in Step 1
- Show registration form inline when "Register New Device" is clicked
- After successful registration:
  - Close/collapse registration form
  - Refresh device list
  - Show success message
  - For ACTIVATION_REQUIRED: Show "Validate OTP" button that navigates to Step 2

### Phase 3: Update Navigation Logic
**Changes:**
- Update all `nav.goToStep()` calls:
  - Remove references to Step 3
  - Update Step 4 → Step 2 (since we're removing Step 3)
- Update step labels: `['Configure', 'Device Management', 'Validate OTP']`
- Ensure ACTIVE devices skip Step 2 entirely

## Benefits

1. **Reduced complexity:** 5 steps → 3 steps (40% reduction)
2. **Better UX:** Less navigation, more intuitive flow
3. **Faster completion:** Fewer page transitions
4. **Clearer purpose:** Each step has a distinct, clear purpose
5. **Less confusion:** No redundant "Send OTP" step when OTP is auto-sent

## Edge Cases to Handle

1. **Existing device authentication:** Keep existing device selection flow in Step 1
2. **OTP resend:** Add resend button to Step 2 (Validate OTP)
3. **Registration errors:** Show inline in Step 1 registration form
4. **ACTIVE vs ACTIVATION_REQUIRED:** Conditional navigation logic already in place

## Migration Notes

- Update `stepLabels` array
- Update all navigation calls (`goToStep`, `goToNext`)
- Remove Step 3 render function
- Merge Step 2 registration into Step 1
- Update Email flow similarly (same structure)

