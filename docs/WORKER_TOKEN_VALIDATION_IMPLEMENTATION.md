# Worker Token Validation Implementation

## Overview

Added validation to prevent users from proceeding to the next step in Unified OAuth flows without a valid worker token.

## Critical Fix (2026-01-31)

**Issue Reported:** Users were able to reach step 1 (or higher) with invalid/expired tokens, seeing error: "Worker token is invalid or expired. Please refresh the worker token."

**Root Cause:** Original implementation only blocked forward navigation but didn't handle:
- Direct URL navigation (e.g., `/v8u/unified/oauth-authz/1`)
- Page refreshes on steps > 0
- Token expiration while on steps > 0

**Solution:** Added auto-redirect to step 0 when invalid token is detected on any step beyond configuration (step 0). Users are immediately shown an error toast and redirected to get/refresh their worker token.

## Changes Made

### File: `src/v8u/components/UnifiedFlowSteps.tsx`

#### 1. **Added Worker Token Validation State** (Lines ~483-484)

```typescript
// Worker token validation state
const [hasValidWorkerToken, setHasValidWorkerToken] = useState(false);
```

Tracks whether the current worker token is valid.

#### 2. **Added Token Status Check Effect with Auto-Redirect** (Lines ~711-750)

```typescript
// Check worker token status when credentials change or component mounts
useEffect(() => {
	const checkTokenStatus = async () => {
		try {
			const { checkWorkerTokenStatus } = await import(
				'@/v8/services/workerTokenStatusServiceV8'
			);
			const status = await checkWorkerTokenStatus();
			setHasValidWorkerToken(status.isValid);

			// If on any step beyond step 0 and no valid token, redirect to step 0
			if (currentStep > 0 && !status.isValid) {
				log.warn(
					'[WORKER TOKEN VALIDATION] Invalid token detected on step ' +
						currentStep +
						' - redirecting to configuration',
					{
						status: status.status,
						message: status.message,
						currentStep,
					}
				);
				toastV8.error(
					'Worker token is invalid or expired. Please refresh the worker token before continuing.',
					{ duration: 7000 }
				);
				// Redirect to step 0 to get/refresh worker token
				navigateToStep(0);
			} else if (currentStep === 0 && !status.isValid) {
				// On step 0, just log warning (don't redirect)
				log.warn('[WORKER TOKEN VALIDATION] No valid worker token on configuration step', {
					status: status.status,
					message: status.message,
				});
			}
		} catch (error) {
			log.error('[WORKER TOKEN VALIDATION] Failed to check worker token status', error);
			setHasValidWorkerToken(false);
		}
	};

	checkTokenStatus();

	// Re-check token status every 30 seconds to catch expiration
	const tokenCheckInterval = setInterval(checkTokenStatus, 30000);

	return () => {
		clearInterval(tokenCheckInterval);
	};
}, [credentials, currentStep, navigateToStep]);
```

**Features:**
- Checks token status when component mounts
- Re-checks when credentials change or step changes
- Auto-refreshes every 30 seconds to catch token expiration
- **NEW: Auto-redirects to step 0 if invalid token detected on any step > 0**
- Shows error toast explaining why user was redirected
- Logs warnings if no valid token is found

#### 3. **Updated Navigation Logic** (Lines ~527-562)

Modified the `nav` object's `canGoNext` property:

```typescript
canGoNext:
	currentStep < totalSteps - 1 &&
	validationErrors.length === 0 &&
	completedSteps.includes(currentStep) &&
	hasValidWorkerToken, // Require valid worker token to proceed
```

**Result:** Next button is disabled if worker token is invalid.

#### 4. **Enhanced Button Tooltip** (Lines ~14068-14090)

Added context-aware tooltip messages:

```typescript
// Determine the tooltip message based on why the button is disabled
let buttonTitle = 'Proceed to next step';
if (!canProceed) {
	if (!hasValidWorkerToken) {
		buttonTitle = '⚠️ Valid worker token required. Click "Get Worker Token" above to proceed.';
	} else if (validationErrors.length > 0) {
		buttonTitle = 'Fix validation errors before proceeding';
	} else if (!completedSteps.includes(currentStep)) {
		buttonTitle = 'Complete the current step first';
	} else {
		buttonTitle = 'Complete all required fields to proceed';
	}
}
```

**Features:**
- Shows specific reason why Next button is disabled
- Prioritizes token validation message
- Directs users to "Get Worker Token" button

#### 5. **Added Click Handler with Toast Notification** (Lines ~14083-14090)

```typescript
// Click handler that shows helpful message when blocked by missing token
const handleNextClick = () => {
	if (!hasValidWorkerToken) {
		toastV8.error(
			'Valid worker token required. Click "Get Worker Token" above to proceed.',
			{ duration: 5000 }
		);
		return;
	}
	nav.goToNext();
};
```

**Features:**
- Shows toast error when user tries to proceed without valid token
- Prevents accidental progression
- Provides clear guidance on how to resolve the issue

## User Experience Flow

### Before Valid Token:

1. User lands on configuration step (Step 0)
2. Worker token status is checked automatically
3. If no valid token:
   - "Next Step" button is **disabled**
   - Tooltip shows: "⚠️ Valid worker token required. Click 'Get Worker Token' above to proceed."
   - Clicking the button shows a toast: "Valid worker token required. Click 'Get Worker Token' above to proceed."

### After Getting Token:

1. User clicks "Get Worker Token" button
2. Worker token is retrieved and stored
3. Token status check runs automatically (within 30 seconds or on next credential change)
4. `hasValidWorkerToken` updates to `true`
5. "Next Step" button becomes **enabled**
6. User can proceed to next step

### Token Expiration:

1. Token status is re-checked every 30 seconds
2. If token expires while on any step > 0:
   - User is **automatically redirected** back to step 0
   - Toast error appears: "Worker token is invalid or expired. Please refresh the worker token before continuing."
   - User must get a new worker token to proceed
3. If token expires on step 0:
   - "Next Step" button becomes disabled
   - User must get a new worker token to proceed

### Direct Navigation / Page Refresh:

1. User navigates directly to `/v8u/unified/oauth-authz/1` (or any step > 0)
2. Token status is checked immediately on mount
3. If no valid token:
   - User is **automatically redirected** back to step 0
   - Toast error explains the issue
   - User must get a valid worker token before proceeding

## Benefits

### 1. **Prevents Invalid API Calls**
- Users can't proceed without valid authentication
- Reduces failed API requests and confusion
- **Auto-redirect prevents being stuck on invalid steps**

### 2. **Clear User Guidance**
- Tooltip explains exactly what's needed
- Toast provides immediate feedback
- Directs users to the solution
- **Auto-redirect with explanation prevents confusion**

### 3. **Automatic Validation**
- Checks token on mount and credential changes
- Periodic re-checks catch expiration
- **Handles direct navigation and page refreshes**
- No manual intervention needed

### 4. **Consistent with Existing Patterns**
- Uses same validation structure as PKCE checks
- Integrates with existing `nav.canGoNext` logic
- Follows established UX patterns
- **Similar to PKCE redirect behavior**

## Technical Details

### Dependencies

- `@/v8/services/workerTokenStatusServiceV8` - Token validation service
  - `checkWorkerTokenStatus()` - Returns `TokenStatusInfo` with `isValid` boolean
  - Checks token presence, expiration, and validity

### State Management

- **Local State**: `hasValidWorkerToken` (boolean)
- **Check Frequency**: Every 30 seconds + on credential change
- **Scope**: Component-level (UnifiedFlowSteps)

### Integration Points

1. **Navigation System**: `nav.canGoNext` in useMemo
2. **Validation Framework**: Alongside `validationErrors` and `completedSteps`
3. **UI Feedback**: Button tooltips and toast notifications
4. **Logging**: Warns in console when token is missing

## Testing Recommendations

### Manual Testing:

1. **No Token Scenario:**
   - Start flow without worker token
   - Verify "Next Step" is disabled
   - Verify tooltip shows token requirement
   - Click button, verify toast appears

2. **Get Token Flow:**
   - Click "Get Worker Token"
   - Verify button becomes enabled
   - Verify can proceed to next step

3. **Token Expiration on Step 1+:**
   - Get valid token, proceed to step 1 or beyond
   - Wait for token to expire (or mock expiration)
   - **Verify auto-redirect to step 0**
   - **Verify toast error appears**
   - Get new token and verify can proceed

4. **Direct Navigation Without Token:**
   - Clear worker token
   - Navigate directly to `/v8u/unified/oauth-authz/1`
   - **Verify immediate redirect to step 0**
   - **Verify toast error appears**

5. **Page Refresh on Step 1+:**
   - Be on step 1 or beyond without valid token
   - Refresh the page
   - **Verify redirect to step 0**
   - **Verify error message**

6. **Credential Changes:**
   - Change credentials (environment, client ID, etc.)
   - Verify token status is re-checked
   - Verify button state updates accordingly

### Edge Cases:

- Token expires mid-flow (now handled with auto-redirect)
- User navigates away and returns (now handled with redirect)
- Direct URL navigation to any step (now handled with redirect)
- Multiple tabs/windows
- Network failures during token check
- Worker token service unavailable
- Page refresh on any step > 0 without valid token

## Future Enhancements

1. **Visual Indicator:**
   - Add token status badge/icon in header
   - Show token expiration countdown

2. **Proactive Modal:**
   - Show modal when token is about to expire
   - Offer to refresh token automatically

3. **Per-Step Requirements:**
   - Some steps might not need worker token
   - Allow override for specific flow types

4. **Offline Mode:**
   - Graceful degradation when token service unavailable
   - Show warning instead of blocking

## Migration Notes

- **No Breaking Changes**: Existing flows continue to work
- **Backwards Compatible**: Token check doesn't affect existing validation
- **Opt-In**: Can be disabled by modifying `canGoNext` logic

## Related Files

- `src/v8u/components/UnifiedFlowSteps.tsx` (modified)
- `src/v8/services/workerTokenStatusServiceV8.ts` (used)
- `src/services/unifiedWorkerTokenService.ts` (underlying service)
- `src/v8/components/WorkerTokenStatusDisplayV8.tsx` (related UI)

## Version

- **Implemented**: 2026-01-31
- **Component Version**: UnifiedFlowSteps v8.0.0
- **Feature**: Worker Token Validation v1.0.0

---

**Status**: ✅ Complete and Ready for Testing
