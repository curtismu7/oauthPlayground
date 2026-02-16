# V8 Toast Notifications Guide

## Overview

V8 uses the V4 toast notification system for consistent user feedback. All V8 code should use the `toastV8` utility for displaying messages to users.

## Quick Start

### Basic Usage

```typescript
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Success notification
toastV8.success('Credentials saved successfully');

// Error notification
toastV8.error('Failed to validate credentials');

// Warning notification
toastV8.warning('Please fill in all required fields');

// Info notification
toastV8.info('Authorization URL copied to clipboard');
```

## Available Methods

### General Notifications

#### `toastV8.success(message: string, options?: { duration?: number })`
Show a success notification.

```typescript
toastV8.success('Configuration saved successfully');
toastV8.success('Flow completed!', { duration: 8000 }); // 8 second duration
```

#### `toastV8.error(message: string, options?: { duration?: number })`
Show an error notification.

```typescript
toastV8.error('Failed to generate authorization URL');
toastV8.error('Network error. Please try again.');
```

#### `toastV8.warning(message: string, options?: { duration?: number })`
Show a warning notification.

```typescript
toastV8.warning('Please fill in all required fields');
toastV8.warning('This action cannot be undone');
```

#### `toastV8.info(message: string, options?: { duration?: number })`
Show an info notification.

```typescript
toastV8.info('Authorization URL copied to clipboard');
toastV8.info('Processing your request...');
```

### Specialized Notifications

#### Copy Operations
```typescript
toastV8.copiedToClipboard('Authorization URL');
// Shows: "Authorization URL copied to clipboard"
```

#### Validation Errors
```typescript
toastV8.validationError(['Client ID', 'Redirect URI']);
// Shows: "Please fill in required fields: Client ID, Redirect URI"
```

#### Network Errors
```typescript
toastV8.networkError('token exchange');
// Shows: "Network error during token exchange. Please check your connection."
```

#### Step Navigation
```typescript
toastV8.stepCompleted(1);
// Shows: "Step 1 completed"

toastV8.flowCompleted();
// Shows: "🎉 OAuth Flow Complete!" (8 second duration)
```

#### Processing/Loading
```typescript
toastV8.processing('Exchanging authorization code for tokens');
// Shows: "Exchanging authorization code for tokens..."
```

#### Credentials
```typescript
toastV8.credentialsSaved();
// Shows: "Credentials saved successfully"

toastV8.credentialsLoaded();
// Shows: "Credentials loaded successfully"
```

#### OAuth/OIDC Operations
```typescript
toastV8.pkceGenerated();
// Shows: "PKCE parameters generated successfully"

toastV8.authUrlGenerated();
// Shows: "Authorization URL generated successfully"

toastV8.tokenExchangeSuccess();
// Shows: "Tokens exchanged successfully"

toastV8.tokenIntrospectionSuccess();
// Shows: "Token introspection completed successfully"

toastV8.userInfoFetched();
// Shows: "User information retrieved successfully"
```

#### App Discovery
```typescript
toastV8.appDiscoverySuccess();
// Shows: "Application discovered successfully"

toastV8.discoveryEndpointLoaded();
// Shows: "Discovery endpoint loaded successfully"

toastV8.environmentIdExtracted();
// Shows: "Environment ID extracted from discovery"
```

#### Configuration
```typescript
toastV8.configurationChecked();
// Shows: "Configuration check completed"

toastV8.flowReset();
// Shows: "Flow reset. Tokens cleared, credentials preserved."
```

#### Scopes
```typescript
toastV8.scopeRequired('openid');
// Shows: "Added required "openid" scope for compliance"
```

## Usage Examples

### In Services

```typescript
// src/v8/services/credentialsServiceV8.ts
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

export class CredentialsServiceV8 {
  static saveCredentials(flowKey: string, credentials: Credentials): void {
    try {
      // Save logic
      localStorage.setItem(`credentials-${flowKey}`, JSON.stringify(credentials));
      toastV8.credentialsSaved();
    } catch (error) {
      toastV8.error('Failed to save credentials');
    }
  }

  static loadCredentials(flowKey: string): Credentials {
    try {
      const data = localStorage.getItem(`credentials-${flowKey}`);
      if (data) {
        toastV8.credentialsLoaded();
        return JSON.parse(data);
      }
    } catch (error) {
      toastV8.error('Failed to load credentials');
    }
    return getDefaultCredentials();
  }
}
```

### In Components

```typescript
// src/v8/components/StepActionButtonsV8.tsx
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

export const StepActionButtonsV8: React.FC<Props> = ({ onNext, onPrevious }) => {
  const handleNext = async () => {
    try {
      toastV8.processing('Validating step');
      await validateStep();
      toastV8.stepCompleted(currentStep);
      onNext();
    } catch (error) {
      toastV8.error('Validation failed. Please check your input.');
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
// src/v8/hooks/useStepNavigationV8.ts
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

export const useStepNavigationV8 = (totalSteps: number) => {
  const handleStepChange = (newStep: number) => {
    if (newStep >= totalSteps) {
      toastV8.flowCompleted();
    } else {
      toastV8.stepCompleted(newStep);
    }
    setCurrentStep(newStep);
  };

  return { handleStepChange };
};
```

### In Flows

```typescript
// src/v8/flows/OAuthAuthorizationCodeFlowV8.tsx
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const handleGenerateAuthUrl = async () => {
  try {
    toastV8.processing('Generating authorization URL');
    const url = await OAuthIntegrationServiceV8.generateAuthorizationUrl(credentials);
    setAuthUrl(url);
    toastV8.authUrlGenerated();
  } catch (error) {
    toastV8.error('Failed to generate authorization URL');
  }
};

const handleTokenExchange = async () => {
  try {
    toastV8.processing('Exchanging authorization code for tokens');
    const tokens = await OAuthIntegrationServiceV8.exchangeCodeForTokens(authCode);
    setTokens(tokens);
    toastV8.tokenExchangeSuccess();
  } catch (error) {
    toastV8.networkError('token exchange');
  }
};
```

## Best Practices

### 1. Use Specific Methods When Available
```typescript
// ✅ GOOD - Use specialized method
toastV8.credentialsSaved();

// ❌ AVOID - Generic message
toastV8.success('Credentials saved successfully');
```

### 2. Provide Context in Error Messages
```typescript
// ✅ GOOD - Clear context
toastV8.error('Failed to validate Client ID: Invalid format');

// ❌ AVOID - Vague error
toastV8.error('Error');
```

### 3. Use Processing Notifications for Long Operations
```typescript
// ✅ GOOD - Show user something is happening
toastV8.processing('Exchanging authorization code for tokens');
const tokens = await exchangeCode();
toastV8.tokenExchangeSuccess();

// ❌ AVOID - Silent operation
const tokens = await exchangeCode();
toastV8.success('Done');
```

### 4. Combine with Logging
```typescript
// ✅ GOOD - Log and notify
console.log('[🔐 OAUTH-AUTHZ-CODE-V8] Authorization URL generated', { url });
toastV8.authUrlGenerated();

// ❌ AVOID - Only notify without logging
toastV8.authUrlGenerated();
```

### 5. Handle Validation Errors Properly
```typescript
// ✅ GOOD - List specific fields
const errors = validateCredentials(credentials);
if (errors.length > 0) {
  toastV8.validationError(errors);
}

// ❌ AVOID - Generic validation error
if (errors.length > 0) {
  toastV8.error('Validation failed');
}
```

### 6. Use Appropriate Notification Types
```typescript
// ✅ GOOD - Correct notification type
toastV8.success('Token generated');      // Success
toastV8.warning('Scope added');          // Warning
toastV8.error('Invalid credentials');    // Error
toastV8.info('Copied to clipboard');     // Info

// ❌ AVOID - Wrong notification type
toastV8.success('Invalid credentials');  // Should be error
toastV8.error('Copied to clipboard');    // Should be info
```

## Integration Checklist

When adding toasts to V8 code:

- [ ] Import `toastV8` from `@/v8/utils/toastNotificationsV8`
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
3. Ensure you're importing from the correct path: `@/v8/utils/toastNotificationsV8`

### Toasts Showing Incorrect Message
1. Check for typos in the message string
2. Verify variable interpolation if using dynamic messages
3. Check browser console for any errors

### Toasts Disappearing Too Quickly
1. Use the `duration` option for important messages:
   ```typescript
   toastV8.success('Important message', { duration: 8000 });
   ```

## Related Documentation

- [V8 Development Rules](./v8-development-rules.md) - Naming and structure conventions
- [V8 Code Examples](./V8_CODE_EXAMPLES.md) - More usage examples
- [V4 Toast Messages](../src/utils/v4ToastMessages.ts) - Underlying toast system

## Version History

- **v8.0.0** (2024-11-16) - Initial V8 toast notification system
