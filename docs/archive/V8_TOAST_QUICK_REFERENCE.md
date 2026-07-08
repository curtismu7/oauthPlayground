# V8 Toast Notifications - Quick Reference

## Import
```typescript
import { toast } from '@/v8/utils/toastNotifications';
```

## Common Methods

| Method | Usage | Example |
|--------|-------|---------|
| `success()` | General success | `toast.success('Saved successfully')` |
| `error()` | General error | `toast.error('Failed to save')` |
| `warning()` | General warning | `toast.warning('Please fill fields')` |
| `info()` | General info | `toast.info('Copied to clipboard')` |

## Specialized Methods

### Copy Operations
```typescript
toast.copiedToClipboard('Authorization URL');
```

### Validation
```typescript
toast.validationError(['Client ID', 'Redirect URI']);
```

### Network
```typescript
toast.networkError('token exchange');
```

### Step Navigation
```typescript
toast.stepCompleted(1);
toast.flowCompleted();
```

### Processing
```typescript
toast.processing('Exchanging authorization code for tokens');
```

### Credentials
```typescript
toast.credentialsSaved();
toast.credentialsLoaded();
```

### OAuth/OIDC
```typescript
toast.pkceGenerated();
toast.authUrlGenerated();
toast.tokenExchangeSuccess();
toast.tokenIntrospectionSuccess();
toast.userInfoFetched();
```

### App Discovery
```typescript
toast.appDiscoverySuccess();
toast.discoveryEndpointLoaded();
toast.environmentIdExtracted();
```

### Configuration
```typescript
toast.configurationChecked();
toast.flowReset();
```

### Scopes
```typescript
toast.scopeRequired('openid');
```

## Pattern: Try-Catch with Toasts

```typescript
try {
  toast.processing('Performing operation...');
  const result = await performOperation();
  toast.success('Operation completed successfully');
} catch (error) {
  toast.error('Operation failed: ' + error.message);
}
```

## Pattern: Validation with Toasts

```typescript
const errors = validateInput(data);
if (errors.length > 0) {
  toast.validationError(errors);
  return;
}
toast.success('Validation passed');
```

## Pattern: Copy to Clipboard

```typescript
navigator.clipboard.writeText(text);
toast.copiedToClipboard('Authorization URL');
```

## Duration Options

```typescript
// Default duration (auto-dismiss)
toast.success('Quick message');

// Custom duration (milliseconds)
toast.success('Important message', { duration: 8000 });
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
