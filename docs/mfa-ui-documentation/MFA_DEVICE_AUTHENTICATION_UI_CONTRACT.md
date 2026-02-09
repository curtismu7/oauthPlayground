# MFA Device Authentication Flow - UI Contract

**Last Updated:** 2026-02-05 14:30:00  
**Version:** 2.0.0  
**Status:** ✅ ACTIVE

---

## Overview

This document defines the UI contract for the 6-step MFA Device Authentication flow. This contract must be maintained to ensure consistency across all device types and authentication flows.

---

## Flow Structure

### 6-Step Device Authentication Flow

#### **Standard Device Types** (SMS, Email, TOTP, WhatsApp)
1. **Step 0**: Configuration (environment, user, policy)
2. **Step 1**: User login using Authorization code flow with PKCE
3. **Step 2**: Device Selection (option to call registration if want new device, or have no devices)
4. **Step 3**: OTP/QR Code Generation
5. **Step 4**: OTP Validation
6. **Step 5**: API Documentation
7. **Step 6**: Success screen with all user data and other valuable options

#### **FIDO2 Flow**
1. **Step 0**: Configuration (environment, user, policy)
2. **Step 1**: User login using Authorization code flow with PKCE
3. **Step 2**: Device Selection (option to call registration if want new device, or have no devices)
4. **Step 3**: Start FIDO in Browser
5. **Step 4**: Passkey confirmation
6. **Step 5**: API Documentation
7. **Step 6**: Success screen with all user data and other valuable options

#### **Mobile Flow**
1. **Step 0**: Configuration (environment, user, policy)
2. **Step 1**: User login using Authorization code flow with PKCE
3. **Step 2**: Device Selection (option to call registration if want new device, or have no devices)
4. **Step 3**: Do push to Mobile app
5. **Step 4**: User confirms on Mobile (app is polling waiting for confirmation)
6. **Step 5**: API Documentation
7. **Step 6**: Success screen with all user data and other valuable options

---

## Component Contracts

### Step 0: Configuration

**Component**: `ConfigurationStepV8`

**Props Interface**:
```typescript
interface ConfigurationStepProps {
  renderProps: MFAFlowBaseRenderProps;
}
```

**Requirements**:
- Environment ID input (required)
- Username input (required)
- Device Authentication Policy selection (required)
- Region selection (optional, default: 'na')
- Custom domain input (optional)
- Validation: All required fields must be filled before proceeding

**UI Elements**:
- Form with grid layout (2 columns on desktop, 1 on mobile)
- Real-time validation feedback
- Policy auto-loading when environment is valid
- Clear error messages for invalid inputs

---

### Step 1: User Login

**Component**: `UserLoginStepV8`

**Props Interface**:
```typescript
interface UserLoginStepProps {
  renderProps: MFAFlowBaseRenderProps;
}
```

**Requirements**:
- Prominent "Start PingOne Authentication" button
- OAuth PKCE flow explanation
- Security information display
- Authentication status indicator
- Success state when user is authenticated

**UI Elements**:
- Hero section with authentication shield icon
- Clear call-to-action button
- Information box explaining OAuth PKCE
- Success box showing authenticated user details
- Accessibility: Focus indicators, keyboard navigation

---

### Step 2: Device Selection

**Component**: `DeviceSelectionStepV8`

**Props Interface**:
```typescript
interface DeviceSelectionStepProps {
  renderProps: MFAFlowBaseRenderProps;
  onRegisterNewDevice: () => void;
  onSelectExistingDevice: (device: Device) => void;
}
```

**Requirements**:
- List of existing devices for the user
- "Register New Device" option
- Device details (name, type, status)
- Search/filter functionality
- Clear selection indicators

**UI Elements**:
- Device cards with status indicators
- Search bar for filtering devices
- "Register New Device" button (prominent)
- Device type icons and labels
- Loading states during device fetch

---

### Step 3: Device-Specific Actions

#### Standard Devices (SMS, Email, TOTP, WhatsApp)
**Component**: `OTPGenerationStepV8`

**Requirements**:
- OTP code generation and display
- QR code for TOTP devices
- Send/Resend OTP functionality
- Clear instructions for users
- Countdown timer for OTP expiry

#### FIDO2
**Component**: `FIDO2StepV8`

**Requirements**:
- WebAuthn browser API integration
- Passkey creation/authentication
- Security key selection
- Browser compatibility checks
- Clear error handling

#### Mobile
**Component**: `MobilePushStepV8`

**Requirements**:
- Push notification sending
- Polling for confirmation
- Mobile app instructions
- Countdown timer
- Resend push option

---

### Step 4: Validation

**Component**: `OTPValidationStepV8` (Standard) / `ConfirmationStepV8` (FIDO2/Mobile)

**Requirements**:
- OTP input field (6 digits for standard devices)
- Real-time validation
- Auto-submit when complete
- Resend option
- Clear success/error feedback

---

### Step 5: API Documentation

**Component**: `APIDocsStepV8`

**Requirements**:
- Authentication headers display
- API endpoint examples
- Request/response samples
- Copy-to-clipboard functionality
- Links to full documentation

**UI Elements**:
- Code examples with syntax highlighting
- Copy buttons for code snippets
- Expandable API sections
- External links to PingOne docs

---

### Step 6: Success Screen

**Component**: `SuccessStepV8`

**Requirements**:
- Success celebration animation
- Session summary display
- Export data functionality
- Next steps options
- Security information

**UI Elements**:
- Large success icon
- Session data grid
- Action buttons (Export, New Flow, Device Management)
- Security information box

---

## Navigation & Flow Control

### Step Validation Rules

**Step 0**: All required fields must be valid
**Step 1**: User must be authenticated (user token present)
**Step 2**: Device must be selected or registration initiated
**Step 3**: Device-specific action must be completed
**Step 4**: Validation must be successful
**Step 5**: Always accessible (documentation)
**Step 6**: Final step, no validation needed

### Button States

**Next Button**:
- Disabled when validation fails
- Shows loading state during async operations
- Progresses to next step on success

**Previous Button**:
- Disabled on Step 0
- Returns to previous step
- Preserves form state

**Start Again Button**:
- Resets entire flow
- Clears all stored data
- Returns to Step 0

---

## Error Handling

### Validation Errors
- Display inline with relevant fields
- Use consistent error styling
- Provide clear resolution instructions
- Don't block navigation unnecessarily

### API Errors
- Show user-friendly error messages
- Provide retry options
- Log technical details
- Offer alternative solutions

### Network Errors
- Show connectivity status
- Provide offline indicators
- Auto-retry where appropriate
- Manual retry options

---

## Accessibility Requirements

### Keyboard Navigation
- Tab order follows logical flow
- All interactive elements focusable
- Enter/Space key activation
- Escape key cancels operations

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content
- Clear step announcements

### Visual Accessibility
- High contrast support
- Focus indicators
- Sufficient color contrast
- Text scaling support

---

## Responsive Design

### Desktop (≥768px)
- 2-column form layouts
- Side-by-side content
- Hover states and transitions
- Full feature availability

### Tablet (768px - 1024px)
- Single column layouts
- Touch-friendly buttons
- Simplified navigation
- Maintained functionality

### Mobile (<768px)
- Stacked layouts
- Large touch targets
- Simplified forms
- Essential features only

---

## Performance Requirements

### Loading States
- Show loading indicators for async operations
- Skeleton screens for content loading
- Progress indicators for long operations
- Timeout handling

### Data Persistence
- Auto-save form progress
- Recover from page refresh
- Session storage for temporary data
- Clear data on completion

---

## Security Considerations

### Token Handling
- Never log sensitive tokens
- Secure storage of access tokens
- Token expiry handling
- Secure token transmission

### Input Validation
- Sanitize all user inputs
- Validate on client and server
- Prevent XSS attacks
- Rate limiting considerations

---

## Testing Requirements

### Unit Tests
- Component rendering
- Form validation
- User interactions
- Error scenarios

### Integration Tests
- Step progression
- Data flow
- API integration
- Error handling

### E2E Tests
- Complete user flows
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0.0 | 2026-02-05 | Complete 6-step flow structure | OAuth Playground Team |
| 1.0.0 | 2026-01-01 | Initial 5-step flow | OAuth Playground Team |

---

## Contact & Support

**Questions about this UI contract?**
- **Team**: OAuth Playground Development Team
- **Email**: dev-team@oauth-playground.com
- **Slack**: #oauth-playground-dev

---

*This document is part of the OAuth Playground UI Contract series. For related documents, see the UI Documentation repository.*
