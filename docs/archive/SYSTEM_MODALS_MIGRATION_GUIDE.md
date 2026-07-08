# System Modals Migration Guide

**Quick Reference for Developers**

---

## ❌ Don't Use (System Modals)

```typescript
// ❌ NEVER use these
alert('Message');
confirm('Are you sure?');
prompt('Enter value:');
window.alert('Message');
window.confirm('Are you sure?');
window.prompt('Enter value:');
```

---

## ✅ Use Instead (App Modals)

### Import the Service

```typescript
import { uiNotificationService } from '@/v8/services/uiNotificationService';

// Or dynamic import (preferred for non-V8 files)
const { uiNotificationService } = await import('@/v8/services/uiNotificationService');
```

---

## Toast Messages (Non-Blocking)

### Success
```typescript
// Simple message
uiNotificationService.showSuccess('Operation completed!');

// With options
uiNotificationService.showSuccess('Saved successfully', {
  duration: 5000,
  description: 'Your changes have been saved',
});
```

### Error
```typescript
uiNotificationService.showError('Operation failed');
uiNotificationService.showError('Failed to save: Network error');
```

### Warning
```typescript
uiNotificationService.showWarning('Please review your input');
```

### Info
```typescript
uiNotificationService.showInfo('Processing your request...');
```

---

## Confirmation Dialog (Blocking)

### Simple Confirmation
```typescript
async function handleDelete() {
  const confirmed = await uiNotificationService.confirm('Delete this item?');
  if (confirmed) {
    // User clicked "Confirm"
    deleteItem();
  } else {
    // User clicked "Cancel" or pressed ESC
  }
}
```

### Advanced Confirmation
```typescript
async function handleDelete() {
  const confirmed = await uiNotificationService.confirm({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    severity: 'danger', // 'warning' | 'danger' | 'info'
  });
  
  if (confirmed) {
    deleteItem();
  }
}
```

---

## Prompt Dialog (Blocking)

### Simple Prompt
```typescript
async function handleRename() {
  const newName = await uiNotificationService.prompt('Enter new name:');
  if (newName) {
    // User entered a value and clicked OK
    rename(newName);
  } else {
    // User clicked Cancel or pressed ESC
  }
}
```

### Advanced Prompt
```typescript
async function handleRename() {
  const newName = await uiNotificationService.prompt({
    title: 'Rename Item',
    message: 'Enter a new name for this item:',
    defaultValue: currentName,
    placeholder: 'Item name...',
    confirmText: 'Rename',
    cancelText: 'Cancel',
  });
  
  if (newName) {
    rename(newName);
  }
}
```

---

## Migration Patterns

### Pattern 1: Simple Alert → Toast

**Before:**
```typescript
function saveData() {
  // ... save logic
  alert('Data saved successfully!');
}
```

**After:**
```typescript
async function saveData() {
  // ... save logic
  const { uiNotificationService } = await import('@/v8/services/uiNotificationService');
  uiNotificationService.showSuccess('Data saved successfully!');
}
```

### Pattern 2: Confirm → Async Confirm

**Before:**
```typescript
function handleDelete() {
  if (confirm('Delete this item?')) {
    deleteItem();
  }
}
```

**After:**
```typescript
async function handleDelete() {
  const { uiNotificationService } = await import('@/v8/services/uiNotificationService');
  const confirmed = await uiNotificationService.confirm('Delete this item?');
  if (confirmed) {
    deleteItem();
  }
}
```

### Pattern 3: Prompt → Async Prompt

**Before:**
```typescript
function handleRename() {
  const name = prompt('Enter name:');
  if (name) {
    rename(name);
  }
}
```

**After:**
```typescript
async function handleRename() {
  const { uiNotificationService } = await import('@/v8/services/uiNotificationService');
  const name = await uiNotificationService.prompt('Enter name:');
  if (name) {
    rename(name);
  }
}
```

### Pattern 4: Error Alert → Error Toast

**Before:**
```typescript
try {
  await saveData();
  alert('Saved!');
} catch (error) {
  alert('Failed to save: ' + error.message);
}
```

**After:**
```typescript
const { uiNotificationService } = await import('@/v8/services/uiNotificationService');
try {
  await saveData();
  uiNotificationService.showSuccess('Saved!');
} catch (error) {
  uiNotificationService.showError(`Failed to save: ${error.message}`);
}
```

---

## Keyboard Shortcuts

### Confirmation Modal
- **ESC** - Cancel
- **Enter** - Confirm

### Prompt Modal
- **ESC** - Cancel
- **Enter** - Submit

---

## Debugging

### View Notification Logs
```typescript
// Get all notification logs
const logs = uiNotificationService.getLogs();
console.table(logs);

// Export logs as JSON
const json = uiNotificationService.exportLogs();
console.log(json);

// Clear logs
uiNotificationService.clearLogs();
```

### Console Logging
All notifications are automatically logged to console with module tags:
- `[🔔 UI-NOTIFICATION-V8] ✅ Success: ...`
- `[🔔 UI-NOTIFICATION-V8] ❌ Error: ...`
- `[🔔 UI-NOTIFICATION-V8] ⚠️ Warning: ...`
- `[🔔 UI-NOTIFICATION-V8] 🤔 Confirm requested: ...`
- `[🔔 UI-NOTIFICATION-V8] 📝 Prompt requested: ...`

---

## Common Mistakes

### ❌ Forgetting to await
```typescript
// ❌ WRONG - confirm() returns a Promise
if (uiNotificationService.confirm('Delete?')) {
  // This will always be true!
}
```

```typescript
// ✅ CORRECT
if (await uiNotificationService.confirm('Delete?')) {
  // Now it works correctly
}
```

### ❌ Not making function async
```typescript
// ❌ WRONG - Can't use await in non-async function
function handleDelete() {
  const confirmed = await uiNotificationService.confirm('Delete?');
}
```

```typescript
// ✅ CORRECT
async function handleDelete() {
  const confirmed = await uiNotificationService.confirm('Delete?');
}
```

### ❌ Using system modals in new code
```typescript
// ❌ WRONG - Will fail lint/CI checks
alert('Hello');
```

```typescript
// ✅ CORRECT
uiNotificationService.showInfo('Hello');
```

---

## Testing

### Mock the Service
```typescript
// In your test file
jest.mock('@/v8/services/uiNotificationService', () => ({
  uiNotificationService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    confirm: jest.fn().mockResolvedValue(true),
    prompt: jest.fn().mockResolvedValue('test value'),
  },
}));
```

### Test Confirmation
```typescript
it('should confirm before deleting', async () => {
  const confirmSpy = jest.spyOn(uiNotificationService, 'confirm')
    .mockResolvedValue(true);
  
  await handleDelete();
  
  expect(confirmSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('delete'),
    })
  );
});
```

---

## Benefits

✅ **Consistent UX** - All notifications look and behave the same  
✅ **Accessible** - WCAG AA compliant, keyboard support  
✅ **Logged** - All notifications automatically logged for debugging  
✅ **Testable** - Easy to mock and test  
✅ **Non-blocking** - Toasts don't interrupt user flow  
✅ **Customizable** - Severity levels, custom text, etc.

---

## Need Help?

- Check `SYSTEM_MODALS_ELIMINATION_COMPLETE.md` for full documentation
- Run `./scripts/check-system-modals.sh` to find remaining violations
- Look at migrated files for examples:
  - `src/v8/components/MFADeviceManager.tsx`
  - `src/v8/flows/MFAFlow.tsx`
  - `src/pages/ApplicationGenerator.tsx`

---

**Last Updated:** 2024-11-23  
**Version:** 8.0.0
