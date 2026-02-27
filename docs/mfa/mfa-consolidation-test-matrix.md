# MFA Consolidation - Regression Test Matrix

**Created:** 2026-01-29
**Purpose:** Comprehensive test scenarios to ensure 100% feature parity between old and new flows
**Status:** Week 3 Complete - Device configurations tested and validated

---

## Test Coverage Requirements

- **Before each Week 7-8 rollout:** All tests must pass on staging
- **Coverage target:** 100% of existing functionality preserved
- **Test execution:** Manual + automated (E2E with Vitest)

---

## Test Matrix: 6 Devices × 12 Scenarios = 72 Test Cases

| # | Scenario | SMS | Email | Mobile | WhatsApp | TOTP | FIDO2 |
|---|----------|-----|-------|--------|----------|------|-------|
| 1 | Happy path - Admin flow (ACTIVE) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Happy path - Admin flow (ACTIVATION_REQUIRED) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Happy path - User flow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Invalid phone number validation | ✓ | N/A | ✓ | ✓ | N/A | N/A |
| 5 | Invalid email validation | N/A | ✓ | N/A | N/A | N/A | N/A |
| 6 | Invalid OTP code (3 attempts) | ✓ | ✓ | ✓ | ✓ | ✓ | N/A |
| 7 | API error 500 (server error) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8 | API error 401 (invalid token) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 9 | Worker token expires during flow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 10 | Tab navigation (config → device → docs) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 11 | Browser back button handling | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 12 | Success page and "start again" flow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Total:** 72 test cases minimum

---

## Detailed Test Scenarios

### Scenario 1: Happy Path - Admin Flow (ACTIVE)

**Description:** Administrator registers device with ACTIVE status (no activation needed)

**Preconditions:**
- Valid worker token
- Environment ID configured
- Username provided
- Device Authentication Policy selected

**Steps:**
1. Navigate to `/v8/mfa/register/{device}`
2. Select "Admin Flow" registration type
3. Select "ACTIVE" device status
4. Click "Continue to Device Registration"
5. Fill in device-specific fields (phone, email, etc.)
6. Submit registration
7. Verify device created with status=ACTIVE
8. Verify success page displays with device details
9. Verify "Start Again" button works

**Expected Result:**
- Device created successfully with ACTIVE status
- No OTP activation step
- Success page shows device ID, status, and details
- Able to start another registration

**Device-specific validations:**
- SMS: Phone number formatted correctly (+1234567890)
- Email: Email address validated
- TOTP: QR code displayed, secret key shown
- FIDO2: WebAuthn ceremony completed

---

### Scenario 2: Happy Path - Admin Flow (ACTIVATION_REQUIRED)

**Description:** Administrator registers device requiring OTP activation

**Preconditions:** (same as Scenario 1)

**Steps:**
1. Navigate to `/v8/mfa/register/{device}`
2. Select "Admin Flow" registration type
3. Select "ACTIVATION_REQUIRED" device status
4. Click "Continue to Device Registration"
5. Fill in device-specific fields
6. Submit registration
7. Wait for OTP delivery (or TOTP generation)
8. Enter OTP code
9. Submit activation
10. Verify device activated (status=ACTIVE)
11. Verify success page

**Expected Result:**
- Device created with ACTIVATION_REQUIRED status
- OTP sent/generated
- After entering correct OTP, device status changes to ACTIVE
- Success page displays

**Device-specific:**
- SMS/Email/Mobile/WhatsApp: OTP sent via respective channel
- TOTP: 6-digit TOTP code from QR code
- FIDO2: N/A (uses WebAuthn, not OTP)

---

### Scenario 3: Happy Path - User Flow

**Description:** User self-registers device using access token

**Preconditions:**
- Valid user access token (from OAuth login)
- Environment ID configured
- Username from token

**Steps:**
1. Navigate to `/v8/mfa/register/{device}`
2. Select "User Flow" registration type
3. Verify user token auto-populated
4. Click "Continue to Device Registration"
5. Fill in device-specific fields
6. Submit registration (always ACTIVATION_REQUIRED for user flow)
7. Enter OTP
8. Verify device activated
9. Verify success page

**Expected Result:**
- Device created with ACTIVATION_REQUIRED status (forced for user flow)
- OTP activation required
- Success page displays

---

### Scenario 4: Invalid Phone Number Validation

**Applies to:** SMS, Mobile, WhatsApp

**Description:** Test validation for invalid phone numbers

**Test cases:**
- Missing country code → Error: "Country code is required"
- Invalid country code (e.g., "+999") → Error: "Invalid country code"
- Phone number too short (e.g., "123") → Error: "Phone number must be at least 7 digits"
- Phone number contains letters → Error: "Phone number must contain only digits"
- Missing phone number → Error: "Phone number is required"

**Expected Result:**
- Inline validation error displayed
- Form submission blocked
- Error cleared when user corrects input

---

### Scenario 5: Invalid Email Validation

**Applies to:** Email

**Description:** Test validation for invalid emails

**Test cases:**
- Missing @ symbol → Error: "Invalid email address"
- Missing domain → Error: "Invalid email address"
- Empty email → Error: "Email is required"
- Invalid characters → Error: "Invalid email address"

**Expected Result:** (same as Scenario 4)

---

### Scenario 6: Invalid OTP Code (3 Attempts)

**Applies to:** SMS, Email, Mobile, WhatsApp, TOTP

**Description:** Test OTP validation with incorrect codes

**Steps:**
1. Register device (ACTIVATION_REQUIRED)
2. Enter incorrect OTP code (e.g., "000000")
3. Submit → Error: "Invalid OTP code. 2 attempts remaining"
4. Enter incorrect OTP again
5. Submit → Error: "Invalid OTP code. 1 attempt remaining"
6. Enter incorrect OTP third time
7. Submit → Error: "Maximum attempts exceeded. Device locked."

**Expected Result:**
- Each failed attempt decreases remaining attempts
- After 3 failures, device is locked
- User cannot retry without re-registering device

---

### Scenario 7: API Error 500 (Server Error)

**Applies to:** All devices

**Description:** Test handling of server errors

**Steps:**
1. Mock API to return 500 error
2. Attempt device registration
3. Verify error handling

**Expected Result:**
- User-friendly error message displayed: "Server error. Please try again."
- Retry button available
- Error logged to console/error tracking
- User can retry without losing form data

---

### Scenario 8: API Error 401 (Invalid Token)

**Applies to:** All devices

**Description:** Test handling of authentication errors

**Steps:**
1. Use expired/invalid worker token
2. Attempt device registration
3. Verify error handling

**Expected Result:**
- Error message: "Invalid or expired token. Please refresh your worker token."
- Link/button to refresh worker token
- User redirected to token modal or login

---

### Scenario 9: Worker Token Expires During Flow

**Applies to:** All devices (Admin flow only)

**Description:** Test token refresh mid-flow

**Steps:**
1. Start device registration with worker token expiring in 1 minute
2. Fill out form slowly
3. Submit after token expires
4. Verify token auto-refresh or error handling

**Expected Result:**
- Auto-refresh: Token refreshed transparently, request succeeds
- OR: Error message with token refresh prompt

---

### Scenario 10: Tab Navigation

**Applies to:** All devices

**Description:** Test navigation between config, device, docs tabs

**Steps:**
1. Navigate to `/v8/mfa/register/{device}`
2. Verify "Config" tab is active by default
3. Click "Device Registration" tab
4. Verify tab switches, URL updates to `?tab=device`
5. Click "Documentation" tab
6. Verify tab switches, URL updates to `?tab=docs`
7. Click browser back button
8. Verify tab returns to previous (`?tab=device`)
9. Refresh page
10. Verify correct tab persists based on URL

**Expected Result:**
- Tabs switch correctly
- URL query param reflects current tab
- Browser back/forward navigation works
- Page refresh maintains tab state

---

### Scenario 11: Browser Back Button Handling

**Applies to:** All devices

**Description:** Test in-flow back button behavior

**Steps:**
1. Navigate to `/v8/mfa/register/{device}` (config tab)
2. Click "Continue to Device Registration"
3. Navigate to `?tab=device`
4. Fill out form
5. Click browser back button
6. Verify returns to config tab
7. Verify form data is preserved (or user is warned of data loss)

**Expected Result:**
- Back button returns to previous view
- URL updates correctly
- Form data handling is graceful (warn before data loss)

---

### Scenario 12: Success Page and "Start Again"

**Applies to:** All devices

**Description:** Test success page display and restart functionality

**Steps:**
1. Complete full device registration (happy path)
2. Verify success page displays:
   - Device ID
   - Device type
   - Status (ACTIVE)
   - Phone/email (if applicable)
   - Nickname (if set)
3. Click "Start Again" button
4. Verify returns to config tab
5. Verify form is cleared
6. Verify can start new registration

**Expected Result:**
- Success page shows complete device details
- "Start Again" clears form and returns to config
- Multiple registrations work in sequence

---

## Device-Specific Test Cases

### TOTP-Specific Tests

**Scenario T1: QR Code Display**
- QR code generates and displays correctly
- Manual entry key shown
- QR code scannable by authenticator app

**Scenario T2: TOTP Code Validation**
- Time-based code from QR works
- Manual entry secret works
- Expired codes rejected

---

### FIDO2-Specific Tests

**Scenario F1: WebAuthn Registration**
- Biometric prompt appears
- Registration completes after biometric approval
- Error handling for biometric failure

**Scenario F2: FIDO2 Device Compatibility**
- Touch ID works (macOS)
- Windows Hello works (Windows)
- Hardware security key works

---

## Performance Test Cases

### P1: Page Load Time
- Config tab loads in < 2s
- Device tab loads in < 2s
- Docs tab loads in < 1s

### P2: API Response Time
- Device registration API responds in < 1s (P95)
- OTP activation API responds in < 1s (P95)

### P3: Bundle Size
- Unified component bundle smaller than sum of 6 device components
- Code splitting works correctly

---

## Accessibility Test Cases

### A1: Keyboard Navigation
- All tabs accessible via keyboard
- Form fields navigable with Tab key
- Buttons activatable with Enter/Space

### A2: Screen Reader Support
- Tab labels announced correctly
- Form fields have labels
- Errors announced to screen reader users

### A3: WCAG 2.1 AA Compliance
- Color contrast ratios meet AA standards
- Focus indicators visible
- Error messages clear

---

## Visual Regression Tests

Use screenshots from old flows as baseline. Compare new unified flow visually.

**Capture points:**
1. Config tab (before filling)
2. Config tab (after filling, before submit)
3. Device tab (form view)
4. Device tab (OTP input)
5. Success page
6. Docs tab

**Tool:** Playwright or similar for screenshot comparison

---

## Test Execution Schedule

### Phase 0 - ✅ COMPLETE
- [x] Define test matrix
- [x] Set up test scaffolding
- [x] Create E2E test stubs

### Week 1-2 (Services)
- [ ] Unit tests for MFATokenManagerV8
- [ ] Unit tests for MFACredentialManagerV8

### Week 3 (Config) - ✅ COMPLETE
- [x] Unit tests for deviceFlowConfigs
- [x] Validation function tests
  - Phone number validation (US/International)
  - Email validation
  - Country code validation
  - Device name validation (max 50 chars)
  - Nickname validation (max 100 chars)
- [x] Configuration completeness tests
  - All 6 device types configured (SMS, Email, Mobile, WhatsApp, TOTP, FIDO2)
  - Required fields defined per device
  - Optional fields defined per device
  - API endpoints defined per device
  - Documentation metadata complete

### Week 4-5 (Component)
- [ ] Component tests for UnifiedMFARegistrationFlowV8
- [ ] Integration tests with services

### Week 6 (Routes)
- [ ] Route switching tests with feature flags

### Week 7 (SMS Rollout)
- [ ] Run full test suite on SMS flow (old + new)
- [ ] Manual QA for SMS on staging
- [ ] Performance testing

### Week 8 (Full Rollout)
- [ ] Run full test suite for all 6 devices
- [ ] Visual regression testing
- [ ] Accessibility audit

### Week 9 (Cleanup)
- [ ] Final regression test after old code removal
- [ ] Performance baseline comparison

---

## Test Data

### Test Credentials
```json
{
  "environmentId": "test-env-123",
  "clientId": "test-client-456",
  "username": "testuser@example.com",
  "workerToken": "eyJhbGciOi...",
  "userToken": "eyJhbGciOi..."
}
```

### Test Phone Numbers (SMS/Mobile/WhatsApp)
- Valid: "+1234567890", "+44123456789"
- Invalid: "123", "+999123", "abc123"

### Test Emails
- Valid: "test@example.com", "user.name+tag@domain.co.uk"
- Invalid: "test", "test@", "@domain.com", "test@domain"

### Test OTP Codes
- Valid: "123456" (mock)
- Invalid: "000000", "abc123", "12345" (too short)

---

## Success Criteria

**All tests must pass before each rollout percentage increase.**

- Week 7 (SMS 10%): All 12 SMS scenarios pass
- Week 7 (SMS 50%): All SMS scenarios + no production errors
- Week 7 (SMS 100%): All SMS scenarios + 7 days stable
- Week 8: Repeat for all 6 devices

**Exit criteria for Phase 9:**
- All 72 test cases passing
- 0 critical bugs
- Performance baseline met or exceeded
- Accessibility audit passed

---

## Test Automation

**Framework:** Vitest + Testing Library + Playwright (for E2E)

**Test file locations:**
- Unit: `src/v8/services/__tests__/`
- Component: `src/v8/components/__tests__/`
- Integration: `src/v8/__tests__/integration/`
- E2E: `src/v8/__tests__/e2e/`

**CI Integration:**
- Run tests on every PR
- Block merge if tests fail
- Required for deployment to staging/production

---

## Monitoring During Rollout

**Metrics to track:**
- Registration success rate (> 95%)
- Error rate (< 1%)
- P95 latency (< 2s)
- Completion rate (start to success)

**Alerts:**
- Error rate > 5% for 15 min → Auto-rollback
- Completion rate < 90% for 15 min → Investigate

---

**Status:** ✅ Week 3 Complete - Device flow configurations implemented and validated
**Next:** Week 4-5 - UnifiedMFARegistrationFlowV8 component tests
