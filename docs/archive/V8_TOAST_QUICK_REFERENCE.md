# V8 Toast Notifications - Quick Reference

## Import
```typescript
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
```

## Common Methods

| Method | Usage | Example |
|--------|-------|---------|
| `success()` | General success | `toastV8.success('Saved successfully')` |
| `error()` | General error | `toastV8.error('Failed to save')` |
| `warning()` | General warning | `toastV8.warning('Please fill fields')` |
| `info()` | General info | `toastV8.info('Copied to clipboard')` |

## Specialized Methods

### Copy Operations
```typescript
toastV8.copiedToClipboard('Authorization URL');
```

### Validation
```typescript
toastV8.validationError(['Client ID', 'Redirect URI']);
```

### Network
```typescript
toastV8.networkError('token exchange');
```

### Step Navigation
```typescript
toastV8.stepCompleted(1);
toastV8.flowCompleted();
```

### Processing
```typescript
toastV8.processing('Exchanging authorization code for tokens');
```

### Credentials
```typescript
toastV8.credentialsSaved();
toastV8.credentialsLoaded();
```

### OAuth/OIDC
```typescript
toastV8.pkceGenerated();
toastV8.authUrlGenerated();
toastV8.tokenExchangeSuccess();
toastV8.tokenIntrospectionSuccess();
toastV8.userInfoFetched();
```

### App Discovery
```typescript
toastV8.appDiscoverySuccess();
toastV8.discoveryEndpointLoaded();
toastV8.environmentIdExtracted();
```

### Configuration
```typescript
toastV8.configurationChecked();
toastV8.flowReset();
```

### Scopes
```typescript
toastV8.scopeRequired('openid');
```

## Pattern: Try-Catch with Toasts

```typescript
try {
  toastV8.processing('Performing operation...');
  const result = await performOperation();
  toastV8.success('Operation completed successfully');
} catch (error) {
  toastV8.error('Operation failed: ' + error.message);
}
```

## Pattern: Validation with Toasts

```typescript
const errors = validateInput(data);
if (errors.length > 0) {
  toastV8.validationError(errors);
  return;
}
toastV8.success('Validation passed');
```

## Pattern: Copy to Clipboard

```typescript
navigator.clipboard.writeText(text);
toastV8.copiedToClipboard('Authorization URL');
```

## Duration Options

```typescript
// Default duration (auto-dismiss)
toastV8.success('Quick message');

// Custom duration (milliseconds)
toastV8.success('Important message', { duration: 8000 });
```

## Notification Types

| Type | Color | Use Case |
|------|-------|----------|
| Success | Green | Successful operations |
| Error | Red | Failed operations |
| Warning | Yellow | Cautions, missing fields |
| Info | Blue | General information |

## Best Practices

✅ **DO:**
- Use specific methods when available
- Provide context in error messages
- Show processing notifications for long operations
- Combine with console logging
- Use appropriate notification type

❌ **DON'T:**
- Use generic messages
- Show multiple toasts at once
- Use wrong notification type
- Forget to handle errors
- Ignore user feedback

## Full Documentation

See [V8_TOAST_NOTIFICATIONS_GUIDE.md](./V8_TOAST_NOTIFICATIONS_GUIDE.md) for complete documentation.
