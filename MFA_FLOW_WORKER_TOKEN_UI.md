# MFA Flow - Worker Token UI Integration

## Changes Made

### Added Worker Token Button and Status Display

The MFA flow now includes a visible worker token management button with real-time status display.

## UI Components Added

### 1. Worker Token Button
- **Location:** Step 0 (Configure MFA Settings)
- **Appearance:** 
  - Green button when token is valid: "Manage Token"
  - Red button when token is missing: "Add Token"
- **Functionality:**
  - Click to open worker token modal (if no token)
  - Click to remove token (if token exists)

### 2. Token Status Display
- **Real-time status indicator** showing:
  - ✓ Valid token with time remaining
  - ⚠️ Token expiring soon (< 15 minutes)
  - ✗ Token expired or missing
- **Color-coded background:**
  - Green (#d1fae5) - Valid token
  - Yellow (#fef3c7) - Expiring soon
  - Red (#fee2e2) - Expired/missing

### 3. Worker Token Modal
- **Full credential management:**
  - Environment ID
  - Client ID
  - Client Secret
  - Region selection (US, EU, AP, CA)
  - Token endpoint authentication method
- **Features:**
  - Save credentials for reuse
  - Show/hide client secret
  - Educational tooltips
  - Request preview before execution

## Services Integrated

### WorkerTokenServiceV8
- **Global token storage** across all flows
- **Storage layers:**
  - Memory cache (fast)
  - localStorage (primary)
  - IndexedDB (backup)
- **Automatic token caching** with expiration

### WorkerTokenStatusServiceV8
- **Real-time status checking**
- **Status types:**
  - `valid` - Token is active
  - `expiring-soon` - Less than 15 minutes remaining
  - `expired` - Token has expired
  - `missing` - No token configured
- **Helper methods:**
  - `getStatusColor()` - Returns color for status
  - `getStatusIcon()` - Returns icon for status
  - `formatTimeRemaining()` - Formats expiry time

## User Experience

### First Time Setup
1. User opens MFA flow
2. Sees red "Add Token" button with warning message
3. Clicks button to open worker token modal
4. Enters worker app credentials
5. Generates token
6. Token status updates to green "Manage Token"
7. Can proceed with MFA flow

### Subsequent Uses
1. User opens MFA flow
2. Sees green "Manage Token" button with time remaining
3. Token is automatically used for all API calls
4. Status updates every 30 seconds
5. Warning appears when token expires soon
6. Can regenerate token if needed

### Token Expiration
1. Status changes to yellow when < 15 minutes remaining
2. Status changes to red when expired
3. User prompted to generate new token
4. One-click regeneration with saved credentials

## Event System

### Custom Events
- `workerTokenUpdated` - Fired when token is generated or removed
- Listened by all components using worker tokens
- Triggers status refresh across the app

### Storage Events
- Listens to localStorage changes
- Updates status when token changes in another tab
- Ensures consistent state across browser tabs

## Code Structure

### State Management
```typescript
const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
const [tokenStatus, setTokenStatus] = useState(() =>
  WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
);
```

### Status Checking
```typescript
useEffect(() => {
  const checkStatus = () => {
    const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
    setTokenStatus(status);
  };

  // Check every 30 seconds
  const interval = setInterval(checkStatus, 30000);

  // Listen for changes
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('workerTokenUpdated', handleStorageChange);

  return () => {
    clearInterval(interval);
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('workerTokenUpdated', handleStorageChange);
  };
}, []);
```

### Token Management
```typescript
const handleManageWorkerToken = () => {
  if (tokenStatus.isValid) {
    // Remove existing token
    if (confirm('Remove worker token?')) {
      workerTokenServiceV8.clearToken();
      window.dispatchEvent(new Event('workerTokenUpdated'));
      toastV8.success('Worker token removed');
    }
  } else {
    // Open modal to add token
    setShowWorkerTokenModal(true);
  }
};
```

## Visual Design

### Button Styles
```css
.token-button {
  padding: 10px 16px;
  background: #10b981 (valid) | #ef4444 (missing);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### Status Display
```css
.token-status {
  flex: 1;
  padding: 10px 12px;
  background: #d1fae5 (valid) | #fef3c7 (expiring) | #fee2e2 (missing);
  border: 1px solid [status-color];
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
```

## Accessibility

- **Keyboard accessible** - All buttons and modals
- **Screen reader friendly** - Proper ARIA labels
- **Clear visual feedback** - Color + icon + text
- **Tooltips** - Hover hints for all actions

## Testing Checklist

- [ ] Worker token button appears on Step 0
- [ ] Button shows correct state (Add/Manage)
- [ ] Status display shows correct color and message
- [ ] Modal opens when clicking "Add Token"
- [ ] Token can be generated successfully
- [ ] Status updates after token generation
- [ ] Token can be removed by clicking "Manage Token"
- [ ] Status updates every 30 seconds
- [ ] Warning appears when token expires soon
- [ ] Error appears when token is missing
- [ ] MFA operations use the worker token
- [ ] User lookup works with worker token
- [ ] Device registration works with worker token

## Benefits

### For Users
- ✅ **Clear visibility** - Always know token status
- ✅ **One-click access** - Easy token management
- ✅ **Proactive warnings** - Know when token expires
- ✅ **Saved credentials** - No re-entry needed
- ✅ **Consistent experience** - Same pattern across flows

### For Developers
- ✅ **Reusable components** - WorkerTokenModalV8 used everywhere
- ✅ **Centralized service** - Single source of truth
- ✅ **Event-driven updates** - Automatic status sync
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Well-documented** - Clear API and examples

---

**Last Updated:** 2024-11-19  
**Version:** 8.0.0  
**Status:** Active - Worker token UI fully integrated
