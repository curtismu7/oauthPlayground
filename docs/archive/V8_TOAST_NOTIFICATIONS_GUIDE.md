# V8 Toast Notifications Guide

## Overview

V8 uses the V4 toast notification system for consistent user feedback. All V8 code should use the `toast` utility for displaying messages to users.

## Quick Start

### Basic Usage

```typescript
import { toast } from '@/v8/utils/toastNotifications';

// Success notification
toast.success('Credentials saved successfully');

// Error notification
toast.error('Failed to validate credentials');

// Warning notification
toast.warning('Please fill in all required fields');

// Info notification
toast.info('Authorization URL copied to clipboard');
```

## Available Methods

### General Notifications

#### `toast.success(message: string, options?: { duration?: number })`
Show a success notification.

```typescript
toast.success('Configuration saved successfully');
toast.success('Flow completed!', { duration: 8000 }); // 8 second duration
```

#### `toast.error(message: string, options?: { duration?: number })`
Show an error notification.

```typescript
toast.error('Failed to generate authorization URL');
toast.error('Network error. Please try again.');
```

#### `toast.warning(message: string, options?: { duration?: number })`
Show a warning notification.

```typescript
toast.warning('Please fill in all required fields');
toast.warning('This action cannot be undone');
```

#### `toast.info(message: string, options?: { duration?: number })`
Show an info notification.

```typescript
toast.info('Authorization URL copied to clipboard');
toast.info('Processing your request...');
```

### Specialized Notifications

#### Copy Operations
```typescript
toast.copiedToClipboard('Authorization URL');
// Shows: "Authorization URL copied to clipboard"
```

#### Validation Errors
```typescript
toast.validationError(['Client ID', 'Redirect URI']);
// Shows: "Please fill in required fields: Client ID, Redirect URI"
```

#### Network Errors
```typescript
toast.networkError('token exchange');
// Shows: "Network error during token exchange. Please check your connection."
```

#### Step Navigation
```typescript
toast.stepCompleted(1);
// Shows: "Step 1 completed"

toast.flowCompleted();
// Shows: "🎉 OAuth Flow Complete!" (8 second duration)
```

#### Processing/Loading
```typescript
toast.processing('Exchanging authorization code for tokens');
// Shows: "Exchanging authorization code for tokens..."
```

#### Credentials
```typescript
toast.credentialsSaved();
// Shows: "Credentials saved successfully"

toast.credentialsLoaded();
// Shows: "Credentials loaded successfully"
```

#### OAuth/OIDC Operations
```typescript
toast.pkceGenerated();
// Shows: "PKCE parameters generated successfully"

toast.authUrlGenerated();
// Shows: "Authorization URL generated successfully"

toast.tokenExchangeSuccess();
// Shows: "Tokens exchanged successfully"

toast.tokenIntrospectionSuccess();
// Shows: "Token introspection completed successfully"

toast.userInfoFetched();
// Shows: "User information retrieved successfully"
```

#### App Discovery
```typescript
toast.appDiscoverySuccess();
// Shows: "Application discovered successfully"

toast.discoveryEndpointLoaded();
// Shows: "Discovery endpoint loaded successfully"

toast.environmentIdExtracted();
// Shows: "Environment ID extracted from discovery"
```

#### Configuration
```typescript
toast.configurationChecked();
// Shows: "Configuration check completed"

toast.flowReset();
// Shows: "Flow reset. Tokens cleared, credentials preserved."
```

#### Scopes
```typescript
toast.scopeRequired('openid');
// Shows: "Added required "openid" scope for compliance"
```

## Usage Examples

### In Services

```typescript
// src/v8/services/credentialsService.ts
import { toast } from '@/v8/utils/toastNotifications';

export class CredentialsService {
  static saveCredentials(flowKey: string, credentials: Credentials): void {
    try {
      // Save logic
      localStorage.setItem(`credentials-${flowKey}`, JSON.stringify(credentials));
      toast.credentialsSaved();
    } catch (error) {
      toast.error('Failed to save credentials');
    }
  }

  static loadCredentials(flowKey: string): Credentials {
    try {
      const data = localStorage.getItem(`credentials-${flowKey}`);
      if (data) {
        toast.credentialsLoaded();
        return JSON.parse(data);
      }
    } catch (error) {
      toast.error('Failed to load credentials');
    }
    return getDefaultCredentials();
  }
}
```

### In Components

```typescript
// src/v8/components/StepActionButtons.tsx
import { toast } from '@/v8/utils/toastNotifications';

export const StepActionButtons: React.FC<Props> = ({ onNext, onPrevious }) => {
  const handleNext = async () => {
    try {
      toast.processing('Validating step');
      await validateStep();
      toast.stepCompleted(currentStep);
      onNext();
    } catch (error) {
      toast.error('Validation failed. Please check your input.');
    }
  };

  return (
    <button onClick={handleNext}>
      Next Step
    </button>
  );
};
```

### In Hooks

```typescript
// src/v8/hooks/useStepNavigation.ts
import { toast } from '@/v8/utils/toastNotifications';

export const useStepNavigation = (totalSteps: number) => {
  const handleStepChange = (newStep: number) => {
    if (newStep >= totalSteps) {
      toast.flowCompleted();
    } else {
      toast.stepCompleted(newStep);
    }
    setCurrentStep(newStep);
  };

  return { handleStepChange };
};
```

### In Flows

```typescript
// src/v8/flows/OAuthAuthorizationCodeFlow.tsx
import { toast } from '@/v8/utils/toastNotifications';

const handleGenerateAuthUrl = async () => {
  try {
    toast.processing('Generating authorization URL');
    const url = await OAuthIntegrationService.generateAuthorizationUrl(credentials);
    setAuthUrl(url);
    toast.authUrlGenerated();
  } catch (error) {
    toast.error('Failed to generate authorization URL');
  }
};

const handleTokenExchange = async () => {
  try {
    toast.processing('Exchanging authorization code for tokens');
    const tokens = await OAuthIntegrationService.exchangeCodeForTokens(authCode);
    setTokens(tokens);
    toast.tokenExchangeSuccess();
  } catch (error) {
    toast.networkError('token exchange');
  }
};
```

## Best Practices

### 1. Use Specific Methods When Available
```typescript
// ✅ GOOD - Use specialized method
toast.credentialsSaved();

// ❌ AVOID - Generic message
toast.success('Credentials saved successfully');
```

### 2. Provide Context in Error Messages
```typescript
// ✅ GOOD - Clear context
toast.error('Failed to validate Client ID: Invalid format');

// ❌ AVOID - Vague error
toast.error('Error');
```

### 3. Use Processing Notifications for Long Operations
```typescript
// ✅ GOOD - Show user something is happening
toast.processing('Exchanging authorization code for tokens');
const tokens = await exchangeCode();
toast.tokenExchangeSuccess();

// ❌ AVOID - Silent operation
const tokens = await exchangeCode();
toast.success('Done');
```

### 4. Combine with Logging
```typescript
// ✅ GOOD - Log and notify
console.log('[🔐 OAUTH-AUTHZ-CODE-V8] Authorization URL generated', { url });
toast.authUrlGenerated();

// ❌ AVOID - Only notify without logging
toast.authUrlGenerated();
```

### 5. Handle Validation Errors Properly
```typescript
// ✅ GOOD - List specific fields
const errors = validateCredentials(credentials);
if (errors.length > 0) {
  toast.validationError(errors);
}

// ❌ AVOID - Generic validation error
if (errors.length > 0) {
  toast.error('Validation failed');
}
```

### 6. Use Appropriate Notification Types
```typescript
// ✅ GOOD - Correct notification type
toast.success('Token generated');      // Success
toast.warning('Scope added');          // Warning
toast.error('Invalid credentials');    // Error
toast.info('Copied to clipboard');     // Info

// ❌ AVOID - Wrong notification type
toast.success('Invalid credentials');  // Should be error
toast.error('Copied to clipboard');    // Should be info
```

## Integration Checklist

When adding toasts to V8 code:

- [ ] Import `toast` from `@/v8/utils/toastNotifications`
- [ ] Use appropriate notification method for the action
- [ ] Include context in error messages
- [ ] Show processing notifications for long operations
- [ ] Test notification display and timing
- [ ] Verify notification doesn't break accessibility
- [ ] Document toast usage in code comments if non-obvious

## Troubleshooting

### Toasts Not Showing
1. Verify `v4ToastManager` is properly initialized in your app
2. Check that `useNotifications` hook is available
3. Ensure you're importing from the correct path: `@/v8/utils/toastNotifications`

### Toasts Showing Incorrect Message
1. Check for typos in the message string
2. Verify variable interpolation if using dynamic messages
3. Check browser console for any errors

### Toasts Disappearing Too Quickly
1. Use the `duration` option for important messages:
   ```typescript
   toast.success('Important message', { duration: 8000 });
   ```

## Related Documentation

- [V8 Development Rules](./v8-development-rules.md) - Naming and structure conventions
- [V8 Code Examples](./V8_CODE_EXAMPLES.md) - More usage examples
- [V4 Toast Messages](../src/utils/v4ToastMessages.ts) - Underlying toast system

## Version History

- **v8.0.0** (2024-11-16) - Initial V8 toast notification system
