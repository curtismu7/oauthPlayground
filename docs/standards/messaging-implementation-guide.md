# Messaging System Implementation Guide

**Version**: 9.0.0  
**Last Updated**: March 6, 2026  
**Status**: 🚀 **DEVELOPER READY**

---

## 🎯 **Quick Start**

This guide provides practical, copy-paste examples for adding messaging to your applications and flows.

---

## 📋 **Choose Your Messaging System**

### **Are you working on:**
- **V7 Flow?** → Use V7 toast (keep existing)
- **V8 Flow?** → Use V8 toast (enhanced)
- **V9 Flow?** → Use V9 modern messaging (new)
- **Mixed Version?** → Use adapter pattern

---

## 🔧 **Implementation Examples**

### **V7 Flows - Legacy Toast**
```typescript
// src/pages/flows/v7/YourFlowV7.tsx
import { v4ToastManager } from '@/utils/v4ToastMessages';

const YourFlowV7: React.FC = () => {
  const handleSuccess = () => {
    // TODO: Migrate to V8 toast when upgrading to V8
    v4ToastManager.showSuccess('Operation completed');
  };

  const handleError = () => {
    v4ToastManager.showError('Error occurred');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
    </div>
  );
};
```

### **V8 Flows - Enhanced Toast**
```typescript
// src/pages/flows/v8/YourFlowV8.tsx
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const YourFlowV8: React.FC = () => {
  const handleSuccess = () => {
    toastV8.success('Configuration saved successfully');
  };

  const handleError = () => {
    toastV8.error('Failed to save configuration');
  };

  const handleWarning = () => {
    toastV8.warning('Please fill in all required fields');
  };

  const handleInfo = () => {
    toastV8.info('Authorization URL copied to clipboard');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Save Config</button>
      <button onClick={handleError}>Trigger Error</button>
      <button onClick={handleWarning}>Validate</button>
      <button onClick={handleInfo}>Copy URL</button>
    </div>
  );
};
```

### **V9 Flows - Modern Messaging**
```typescript
// src/pages/flows/v9/YourFlowV9.tsx
import React, { useState } from 'react';
import { useModernMessaging } from '@/services/v9/V9ModernMessagingService';
import { V9ModernMessagingComponents } from '@/components/v9/V9ModernMessagingComponents';

const { WaitScreen, Banner, CriticalError, FooterMessage } = V9ModernMessagingComponents;

const YourFlowV9: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messageState, modernMessaging] = useModernMessaging();

  const handleAsyncOperation = async () => {
    setIsLoading(true);
    
    // Show wait screen for blocking operations
    modernMessaging.showWaitScreen({
      message: 'Processing your request...',
      allowCancel: true,
      onCancel: () => {
        setIsLoading(false);
        modernMessaging.hideWaitScreen();
      }
    });

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success banner
      modernMessaging.showBanner({
        type: 'success',
        title: 'Operation Complete',
        message: 'Your request has been processed successfully',
        dismissible: true
      });
    } catch (error) {
      // Show critical error
      modernMessaging.showCriticalError({
        title: 'Operation Failed',
        message: 'Unable to process your request',
        technicalDetails: error.message,
        recoveryActions: [
          {
            label: 'Retry',
            action: handleAsyncOperation,
            instructions: 'Click to retry the operation'
          },
          {
            label: 'Contact Support',
            action: () => window.open('/support'),
            instructions: 'Get help from our support team'
          }
        ],
        contactSupport: true
      });
    } finally {
      setIsLoading(false);
      modernMessaging.hideWaitScreen();
    }
  };

  const handleValidation = () => {
    modernMessaging.showBanner({
      type: 'warning',
      title: 'Validation Required',
      message: 'Please fill in all required fields before proceeding',
      dismissible: true,
      actions: [
        {
          label: 'Review Fields',
          action: () => console.log('Navigate to form'),
          variant: 'primary'
        }
      ]
    });
  };

  const handleStatusUpdate = () => {
    modernMessaging.showFooterMessage({
      type: 'status',
      message: 'Configuration validated successfully',
      duration: 3000
    });
  };

  return (
    <div className="flow-container">
      {/* Modern Messaging Components */}
      <WaitScreen config={messageState.waitScreen} />
      <Banner config={messageState.banner} />
      <CriticalError config={messageState.criticalError} />
      <FooterMessage config={messageState.footerMessage} />

      {/* Flow Content */}
      <div className="flow-content">
        <button onClick={handleAsyncOperation} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Start Operation'}
        </button>
        <button onClick={handleValidation}>Validate</button>
        <button onClick={handleStatusUpdate}>Update Status</button>
      </div>
    </div>
  );
};
```

---

## 🔄 **Migration Examples**

### **Upgrading V7 to V8**
```typescript
// BEFORE (V7)
import { v4ToastManager } from '@/utils/v4ToastMessages';

const handleSuccess = () => {
  v4ToastManager.showSuccess('Operation completed');
};

// AFTER (V8)
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const handleSuccess = () => {
  toastV8.success('Operation completed');
};
```

### **Upgrading V8 to V9**
```typescript
// BEFORE (V8)
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const handleSuccess = () => {
  toastV8.success('Configuration saved');
};

const handleError = () => {
  toastV8.error('Failed to save configuration');
};

const handleInfo = () => {
  toastV8.info('Status updated');
};

// AFTER (V9)
import { useModernMessaging } from '@/services/v9/V9ModernMessagingService';

const MyComponent: React.FC = () => {
  const [messageState, modernMessaging] = useModernMessaging();

  const handleSuccess = () => {
    modernMessaging.showBanner({
      type: 'success',
      title: 'Configuration Saved',
      message: 'Your settings have been saved successfully',
      dismissible: true
    });
  };

  const handleError = () => {
    modernMessaging.showCriticalError({
      title: 'Save Failed',
      message: 'Unable to save configuration',
      recoveryActions: [
        {
          label: 'Retry',
          action: handleSuccess,
          instructions: 'Check your configuration and try again'
        }
      ]
    });
  };

  const handleInfo = () => {
    modernMessaging.showFooterMessage({
      type: 'info',
      message: 'Status updated',
      duration: 3000
    });
  };

  // Remember to render the messaging components!
  return (
    <div>
      <Banner config={messageState.banner} />
      <CriticalError config={messageState.criticalError} />
      <FooterMessage config={messageState.footerMessage} />
      
      {/* Your component content */}
    </div>
  );
};
```

---

## 🎨 **Message Type Patterns**

### **Success Messages**
```typescript
// V8 Toast
toastV8.success('Operation completed successfully');

// V9 Modern
modernMessaging.showBanner({
  type: 'success',
  title: 'Success',
  message: 'Operation completed successfully',
  dismissible: true
});
```

### **Error Messages**
```typescript
// V8 Toast
toastV8.error('Failed to complete operation');

// V9 Modern (for critical errors)
modernMessaging.showCriticalError({
  title: 'Operation Failed',
  message: 'Unable to complete operation',
  recoveryActions: [
    {
      label: 'Retry',
      action: () => handleRetry(),
      instructions: 'Try the operation again'
    }
  ]
});

// V9 Modern (for non-critical errors)
modernMessaging.showBanner({
  type: 'error',
  title: 'Error',
  message: 'Operation failed',
  dismissible: true
});
```

### **Warning Messages**
```typescript
// V8 Toast
toastV8.warning('Please check your configuration');

// V9 Modern
modernMessaging.showBanner({
  type: 'warning',
  title: 'Warning',
  message: 'Please check your configuration',
  dismissible: true
});
```

### **Info Messages**
```typescript
// V8 Toast
toastV8.info('Status updated');

// V9 Modern
modernMessaging.showFooterMessage({
  type: 'info',
  message: 'Status updated',
  duration: 3000
});
```

---

## 🧪 **Testing Your Implementation**

### **V8 Toast Testing**
```typescript
// src/components/__tests__/YourComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import YourComponent from '../YourComponent';

// Mock toastV8
jest.mock('@/v8/utils/toastNotificationsV8');
const mockToastV8 = toastV8 as jest.Mocked<typeof toastV8>;

describe('YourComponent', () => {
  it('should show success toast', () => {
    render(<YourComponent />);
    
    fireEvent.click(screen.getByText('Success Button'));
    
    expect(mockToastV8.success).toHaveBeenCalledWith(
      'Operation completed successfully'
    );
  });
});
```

### **V9 Modern Messaging Testing**
```typescript
// src/components/__tests__/YourV9Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import YourV9Component from '../YourV9Component';

// Mock modern messaging
jest.mock('@/services/v9/V9ModernMessagingService');
const mockModernMessaging = modernMessaging as jest.Mocked<typeof modernMessaging>;

describe('YourV9Component', () => {
  it('should show success banner', () => {
    render(<YourV9Component />);
    
    fireEvent.click(screen.getByText('Success Button'));
    
    expect(mockModernMessaging.showBanner).toHaveBeenCalledWith({
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
      dismissible: true
    });
  });
});
```

---

## 📱 **Common Use Cases**

### **Form Validation**
```typescript
const validateForm = (formData: FormData) => {
  const errors = [];
  
  if (!formData.email) errors.push('Email is required');
  if (!formData.password) errors.push('Password is required');
  
  if (errors.length > 0) {
    // V8
    toastV8.warning(`Please fix: ${errors.join(', ')}`);
    
    // V9
    modernMessaging.showBanner({
      type: 'warning',
      title: 'Validation Error',
      message: errors.join(', '),
      dismissible: true
    });
    return false;
  }
  
  // V8
  toastV8.success('Form validated successfully');
  
  // V9
  modernMessaging.showFooterMessage({
    type: 'success',
    message: 'Form validated successfully',
    duration: 3000
  });
  return true;
};
```

### **API Calls**
```typescript
const makeApiCall = async () => {
  try {
    // V8
    toastV8.info('Making API request...');
    
    // V9
    modernMessaging.showWaitScreen({
      message: 'Making API request...',
      allowCancel: true
    });
    
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    // V8
    toastV8.success('API request completed');
    
    // V9
    modernMessaging.showBanner({
      type: 'success',
      title: 'API Success',
      message: 'Request completed successfully',
      dismissible: true
    });
  } catch (error) {
    // V8
    toastV8.error('API request failed');
    
    // V9
    modernMessaging.showCriticalError({
      title: 'API Error',
      message: 'Unable to complete request',
      technicalDetails: error.message,
      recoveryActions: [
        {
          label: 'Retry',
          action: makeApiCall,
          instructions: 'Try the request again'
        }
      ]
    });
  } finally {
    // V9 only
    modernMessaging.hideWaitScreen();
  }
};
```

### **Copy to Clipboard**
```typescript
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    
    // V8
    toastV8.success(`${label} copied to clipboard`);
    
    // V9
    modernMessaging.showFooterMessage({
      type: 'info',
      message: `${label} copied to clipboard`,
      duration: 3000
    });
  } catch (error) {
    // V8
    toastV8.error(`Failed to copy ${label}`);
    
    // V9
    modernMessaging.showFooterMessage({
      type: 'error',
      message: `Failed to copy ${label}`,
      duration: 5000
    });
  }
};
```

---

## 🔍 **Debugging Tips**

### **Console Logging**
```typescript
// Add debug logging to track message flow
const handleSuccess = () => {
  console.log('[Messaging] Showing success message');
  toastV8.success('Operation completed');
};

const handleV9Success = () => {
  console.log('[Messaging] V9: Showing success banner');
  modernMessaging.showBanner({
    type: 'success',
    title: 'Success',
    message: 'Operation completed',
    dismissible: true
  });
};
```

### **Message State Inspection**
```typescript
// For V9 debugging - check current state
const debugMessageState = () => {
  const state = modernMessaging.getCurrentState();
  console.log('[Messaging Debug] Current state:', state);
};
```

---

## 📋 **Migration Checklist**

### **Before You Start**
- [ ] Identify your flow version (V7, V8, or V9)
- [ ] Review existing messaging in your component
- [ ] Plan your migration approach

### **Implementation Steps**
- [ ] Import correct messaging system
- [ ] Replace existing message calls
- [ ] Add messaging components to render (V9 only)
- [ ] Test all message types
- [ ] Verify accessibility

### **After Migration**
- [ ] Test all user interactions
- [ ] Verify message persistence and dismissal
- [ ] Check for console errors
- [ ] Update documentation
- [ ] Add tests for new messaging

---

## 🎯 **Best Practices**

### **DO**
- ✅ Use the appropriate messaging system for your version
- ✅ Keep messages clear and concise
- ✅ Provide actionable error messages
- ✅ Test all message types
- ✅ Consider accessibility in message content

### **DON'T**
- ❌ Mix messaging systems in the same component
- ❌ Use technical jargon in user-facing messages
- ❌ Show too many messages at once
- ❌ Forget to render V9 messaging components
- ❌ Ignore message persistence behavior

---

## 📞 **Getting Help**

### **Common Issues**
1. **V9 messages not showing** - Did you add the messaging components to your render?
2. **Messages not dismissing** - Check dismissible and duration settings
3. **TypeScript errors** - Verify import paths and types
4. **Test failures** - Mock the messaging service correctly

### **Resources**
- 📚 [Messaging System Standardization](./messaging-system-standardization.md)
- 🔧 [Adapter Pattern Progress](./adapter-pattern-implementation-progress.md)
- 🧪 [Testing Examples](../testing/)
- 💬 [Team Chat] - Ask questions in development channel
- 📋 [Logging Implementation Plan](./logging-implementation-plan.md)
- 🌟 [Gold Star Migration Indicator Guide](./gold-star-migration-indicator-guide.md)
- 📦 [Version Management Standardization Guide](./version-management-standardization-guide.md)

---

**Happy coding! 🚀**

Remember: Start with the right messaging system for your version, test thoroughly, and keep messages user-friendly.
