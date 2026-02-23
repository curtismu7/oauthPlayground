# Feedback System

A modern, accessible feedback system that replaces toast notifications with better UX patterns following WCAG 2.1 AA guidelines and Material Design principles.

## 🎯 Overview

This feedback system provides three main patterns for user feedback:

1. **Inline Messages** - For form validation and contextual help
2. **Page Banners** - For system-wide messages and alerts
3. **Snackbars** - For brief confirmations and process feedback

## 📦 Components

### InlineMessage
Contextual feedback that appears directly where users need it.

**Use Cases:**
- Form validation errors
- Per-field help messages
- Contextual warnings

```typescript
import { InlineMessage } from '@/components/feedback/InlineMessage';

<InlineMessage
  type="error"
  message="This field is required"
  field="email"
  dismissible
/>
```

### PageBanner
Persistent page-level notifications for system-wide messages.

**Use Cases:**
- Network connectivity issues
- System maintenance notifications
- Security warnings
- Account status alerts

```typescript
import { PageBanner } from '@/components/feedback/PageBanner';

<PageBanner
  type="warning"
  title="Connection Issues Detected"
  message="Some features may be unavailable"
  dismissible
  action={{ label: 'Retry', onClick: handleRetry }}
/>
```

### Snackbar
Brief, non-blocking notifications for quick confirmations.

**Use Cases:**
- "Saved successfully" confirmations
- "Copied to clipboard" feedback
- Process completion notifications
- Brief status updates

```typescript
import { Snackbar } from '@/components/feedback/Snackbar';

<Snackbar
  message="Configuration saved"
  type="success"
  action={{ label: 'Undo', onClick: handleUndo }}
  duration={4000}
/>
```

## 🛠️ Service Layer

The `feedbackService` provides a unified API for all feedback patterns:

```typescript
import { feedbackService } from '@/services/feedback/feedbackService';

// Inline messages
feedbackService.showInlineError('Email is required', 'email');
feedbackService.showInlineWarning('Password is weak');
feedbackService.showInlineSuccess('Profile updated');

// Page banners
feedbackService.showErrorBanner('Network Error', 'Unable to connect');
feedbackService.showWarningBanner('Session Expiring Soon');
feedbackService.showInfoBanner('New Features Available');
feedbackService.showSuccessBanner('Configuration Saved');

// Snackbars
feedbackService.showSuccessSnackbar('Item saved');
feedbackService.showInfoSnackbar('Changes synchronized');
feedbackService.showWarningSnackbar('Unsaved changes');
```

## 🎨 Design System Integration

All components use PingOne UI design tokens:

- **Colors**: `--ping-primary-color`, `--ping-error-color`, etc.
- **Spacing**: `--ping-spacing-sm`, `--ping-spacing-md`, etc.
- **Typography**: `--ping-font-size-sm`, `--ping-font-size-base`, etc.
- **Transitions**: `--ping-transition-fast` (0.15s ease-in-out)
- **Border Radius**: `--ping-border-radius-sm`, `--ping-border-radius-md`

## ♿ Accessibility Features

### ARIA Support
- **Inline messages**: No specific role (contextual)
- **Page banners**: `role="alert"` (urgent) or `role="status"` (info)
- **Snackbars**: `role="status"` (non-critical) or `role="alert"` (errors)

### Keyboard Navigation
- All interactive elements support Tab navigation
- Proper focus management and visible focus states
- Keyboard shortcuts (Enter/Space) for button interactions
- Focus trapping for modals

### Screen Reader Support
- Proper ARIA live regions for dynamic content
- Descriptive labels for icon-only controls
- Semantic HTML structure
- Color contrast compliance (WCAG AA)

## 📋 Migration Guide

### From Toast to New Patterns

| Toast Message | New Pattern | Example |
|---------------|-------------|---------|
| "Configuration saved successfully" | Snackbar | ✓ Saved (Undo) |
| "Failed to save credentials" | Inline Error | Field: "Invalid environment ID" |
| "Network error" | Page Banner | ⚠️ Connection issues detected |
| "Copied to clipboard" | Snackbar | ✓ Copied |
| "Please fill required fields" | Inline Validation | Field: "This field is required" |

### Step-by-Step Migration

1. **Identify Toast Usage**: Search for `v4ToastManager` and `toastV8` calls
2. **Categorize Messages**: Determine if each message should be inline, banner, or snackbar
3. **Replace with New Components**: Use the appropriate feedback component
4. **Update Event Handlers**: Ensure proper keyboard navigation
5. **Test Accessibility**: Verify screen reader compatibility

## 🔧 Usage Examples

### Form with Inline Validation

```typescript
const MyForm = () => {
  const [errors, setErrors] = useState({});

  const validateField = (field: string, value: string) => {
    if (!value) {
      setErrors(prev => ({ ...prev, [field]: `${field} is required` }));
    } else {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form>
      <input onChange={(e) => validateField('email', e.target.value)} />
      {errors.email && (
        <InlineMessage
          type="error"
          message={errors.email}
          field="email"
          dismissible
        />
      )}
    </form>
  );
};
```

### System Status Banner

```typescript
const SystemStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState('online');

  useEffect(() => {
    const checkConnection = async () => {
      const isOnline = await navigator.onLine;
      setConnectionStatus(isOnline ? 'online' : 'offline');
    };

    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (connectionStatus === 'offline') {
    return (
      <PageBanner
        type="error"
        title="Connection Lost"
        message="Please check your internet connection"
        persistent
        role="alert"
      />
    );
  }

  return null;
};
```

### Action Confirmation

```typescript
const ActionConfirmation = () => {
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleSave = async () => {
    try {
      await saveData();
      setShowSnackbar(true);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      
      {showSnackbar && (
        <Snackbar
          message="Document saved successfully"
          type="success"
          action={{
            label: 'View',
            onClick: () => router.push('/documents/123')
          }}
          onDismiss={() => setShowSnackbar(false)}
        />
      )}
    </>
  );
};
```

## 🧪 Testing

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import { InlineMessage } from '@/components/feedback/InlineMessage';

describe('InlineMessage', () => {
  it('renders error message correctly', () => {
    render(
      <InlineMessage
        type="error"
        message="This field is required"
        field="email"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('Field: email')).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    const onAction = jest.fn();
    render(
      <InlineMessage
        type="warning"
        message="Action required"
        action={{ label: 'Fix', onClick: onAction }}
      />
    );

    const actionButton = screen.getByText('Fix');
    actionButton.focus();
    fireEvent.keyDown(actionButton, { key: 'Enter' });
    
    expect(onAction).toHaveBeenCalled();
  });
});
```

### Accessibility Tests
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

describe('Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <PageBanner
        type="error"
        title="Error Title"
        message="Error message"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 📚 API Reference

### InlineMessage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `'error' \| 'warning' \| 'info' \| 'success'` | Required | Message type |
| message | `string` | Required | Message content |
| title | `string` | - | Optional title |
| field | `string` | - | Associated field name |
| dismissible | `boolean` | `false` | Show dismiss button |
| action | `{ label: string; onClick: () => void }` | - | Action button |

### PageBanner Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `'error' \| 'warning' \| 'info' \| 'success'` | Required | Banner type |
| title | `string` | Required | Banner title |
| message | `string` | - | Banner message |
| dismissible | `boolean` | `false` | Show dismiss button |
| persistent | `boolean` | `false` | Cannot be dismissed |
| action | `{ label: string; onClick: () => void; disabled?: boolean }` | - | Action button |
| role | `'alert' \| 'status'` | Auto | ARIA role |

### Snackbar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | `string` | Required | Snackbar message |
| type | `'success' \| 'info' \| 'warning'` | Required | Snackbar type |
| duration | `number` | `4000` | Auto-dismiss duration (ms) |
| action | `{ label: string; onClick: () => void }` | - | Action button |
| onDismiss | `() => void` | - | Dismiss callback |
| manualDismiss | `boolean` | `false` | Require manual dismiss |

## 🔄 Migration Status

- ✅ **Phase 1**: Foundation components created
- ✅ **Phase 2**: Service layer implemented
- ✅ **Phase 3**: Examples and documentation
- 🔄 **Phase 4**: Migration in progress
- ⏳ **Phase 5**: Testing and validation

## 🤝 Contributing

When adding new feedback patterns:

1. Follow WCAG 2.1 AA guidelines
2. Use PingOne UI design tokens
3. Include proper ARIA attributes
4. Add keyboard navigation support
5. Write comprehensive tests
6. Update documentation

## 📄 License

This feedback system is part of the MasterFlow API project and follows the same licensing terms.
