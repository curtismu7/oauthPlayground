# TOTP Flow Navigation Analysis
**Last Updated:** 2026-01-06 14:30:00

## Flow Structure

### Registration Flow (isConfigured = true)
- **Step 0:** Configure → Auto-navigates to Step 3
- **Step 1:** Select Device → Auto-navigates to Step 3 (skipped)
- **Step 2:** Register Device (Modal) → Auto-registration happens in Step 3 (skipped)
- **Step 3:** Scan QR Code & Activate (Modal) → Device registration happens automatically
- **Step 4:** Validate → Should NEVER be shown (success shown in Step 3)

### Authentication Flow (isConfigured = false)
- **Step 0:** Configure → Step 1
- **Step 1:** Select Device → Step 2
- **Step 2:** Register Device (Modal) → Step 3
- **Step 3:** Scan QR Code & Activate (Modal) → Step 4
- **Step 4:** Validate (Modal) → Success

## Current Navigation Issues

### 1. Modal Close Behavior
- **Step 2 Modal (Register Device):** When closed, should navigate back to Step 1
- **Step 3 Modal (QR Code):** When closed, should navigate back to previous step
  - Registration flow: Should go back to Step 0 (config page) or hub
  - Authentication flow: Should go back to Step 2
- **Step 4 Modal (Validate):** When closed, should navigate back to Step 3

### 2. Previous Button Behavior
- Should work on all steps
- Should close modals if open
- Should navigate to previous step
- Should preserve state

### 3. Forward Navigation
- Next button should be hidden on steps with modals (Step 2, 3, 4)
- Auto-navigation should respect user's choice to close modals
- Should not create infinite loops

### 4. State Preservation
- When modals are closed, state should be preserved
- User should be able to reopen modals and continue
- Device registration state should persist

### 5. Fallback to Hub
- If user is stuck or can't continue, should go back to hub
- Should happen when:
  - Modal is closed and no valid previous step exists
  - User cancels on Step 0
  - Navigation fails

## Required Fixes

1. **Modal Close Handlers:**
   - Step 2: Close → Navigate to Step 1 (or hub if Step 1 is invalid)
   - Step 3: Close → Navigate to previous valid step (or hub)
   - Step 4: Close → Navigate to Step 3 (or hub)

2. **Previous Button:**
   - Should close modals before navigating
   - Should navigate to previous valid step
   - Should preserve state

3. **Auto-Navigation:**
   - Should respect user's choice to close modals
   - Should not create infinite loops
   - Should use currentStepRef instead of stale props refs

4. **State Preservation:**
   - Modal state should be preserved when navigating
   - User should be able to reopen modals

5. **Fallback to Hub:**
   - Add fallback logic when navigation fails
   - Add fallback when no valid previous step exists

