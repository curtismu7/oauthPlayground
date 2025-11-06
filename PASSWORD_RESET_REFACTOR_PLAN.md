# Password Reset Component Refactoring Plan

## Current State
- File: `src/pages/security/HelioMartPasswordReset.tsx`
- Size: ~2584 lines
- Status: Too large, needs refactoring

## Proposed Component Structure

### 1. Main Container Component
- `HelioMartPasswordReset.tsx` (main orchestrator, ~200 lines)
  - State management
  - Tab navigation
  - Modal management
  - API call tracking

### 2. Tab Components (one per operation)
- `PasswordRecoverTab.tsx` (~150 lines)
- `PasswordForceResetTab.tsx` (~150 lines)
- `PasswordChangeTab.tsx` (~150 lines)
- `PasswordCheckTab.tsx` (~150 lines)
- `PasswordUnlockTab.tsx` (~150 lines)
- `PasswordStateTab.tsx` (~150 lines)
- `PasswordAdminSetTab.tsx` (~150 lines)
- `PasswordSetTab.tsx` (~150 lines)
- `PasswordSetValueTab.tsx` (~150 lines) ⭐ **Recommended**
- `PasswordLdapGatewayTab.tsx` (~150 lines)
- `PasswordOverviewTab.tsx` (~200 lines)

### 3. Shared Components
- `LoginModal.tsx` (~100 lines)
- `PasswordOperationCard.tsx` (reusable card wrapper)
- `ContentTypeHeader.tsx` (displays Content-Type with highlighting)
- `EducationalAlert.tsx` (reusable alert with operation info)

### 4. Shared Utilities
- `passwordOperationTypes.ts` (constants, types)
- `passwordOperationHelpers.ts` (shared handlers)

## Benefits
- Each component < 200 lines
- Easier to test
- Better code organization
- Reusable components
- Easier to maintain

## Implementation Order
1. Extract shared components first
2. Extract tab components one by one
3. Refactor main component last

