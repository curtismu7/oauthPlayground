# Worker Token UI Standards Documentation

## Overview
This document defines the UI standards and implementation patterns for worker token components across all V8 flows to prevent regressions and ensure consistency.

## 🎯 Core Requirements

### 1. Worker Token Button Color Logic
**CRITICAL**: Worker token buttons MUST change color based on token validity to provide clear visual feedback.

#### Implementation Pattern:
```tsx
// ✅ CORRECT - Dynamic color based on token validity
<button 
  className={`btn ${tokenStatus.isValid ? 'btn-light-green' : 'btn-light-red'}`}
  onClick={handleShowWorkerTokenModal}
>
  <i className="mdi-key me-2"></i>
  Configure Worker Token
</button>

// ❌ INCORRECT - Static color
<button className="btn btn-light-red">
```

#### Color States:
- **🟢 Valid Token**: `btn-light-green` class
- **🔴 Invalid Token**: `btn-light-red` class
- **⚪ Neutral**: `btn-light-grey` class (for non-status buttons)

### 2. Required CSS Classes
Ensure these CSS classes are defined in your stylesheet:
**IMPORTANT**: These classes are scoped to `.end-user-nano` namespace for Ping UI consistency.

```css
/* Light Green - Valid State */
.end-user-nano .btn-light-green {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
  transition: all 0.15s ease-in-out;
}

.end-user-nano .btn-light-green:hover {
  background-color: #c3e6cb;
  border-color: #b1dfbb;
  color: #155724;
}

.end-user-nano .btn-light-green:active {
  background-color: #b1dfbb;
  border-color: #b1dfbb;
  color: #155724;
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.end-user-nano .btn-light-green:focus {
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

/* Light Red - Invalid State */
.end-user-nano .btn-light-red {
  background-color: #f8d7da;
  border-color: #f5c2c7;
  color: #721c24;
  transition: all 0.15s ease-in-out;
}

.end-user-nano .btn-light-red:hover {
  background-color: #f5c2c7;
  border-color: #f1b0b7;
  color: #721c24;
}

.end-user-nano .btn-light-red:active {
  background-color: #f1b0b7;
  border-color: #f1b0b7;
  color: #721c24;
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.end-user-nano .btn-light-red:focus {
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

/* Light Grey - Neutral State */
.end-user-nano .btn-light-grey {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #495057;
}

.end-user-nano .btn-light-grey:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}
```

**File Location**: `src/styles/ping-overrides.css`

### 3. Token Status State Management
All components using worker token status must implement this pattern:

```tsx
// Required state
const [tokenStatus, setTokenStatus] = useState<{
  isValid: boolean;
  minutesRemaining: number;
}>({
  isValid: false,
  minutesRemaining: 0,
});

// Required status update function
const updateTokenStatus = async () => {
  try {
    const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
    setTokenStatus({
      isValid: status.isValid,
      minutesRemaining: status.minutesRemaining || 0
    });
  } catch (error) {
    console.error('Failed to check token status', error);
    setTokenStatus({ isValid: false, minutesRemaining: 0 });
  }
};

// Required periodic updates
useEffect(() => {
  updateTokenStatus();
  const interval = setInterval(updateTokenStatus, 30000); // 30 seconds
  return () => clearInterval(interval);
}, []);
```

## 🏗️ Component Standards

### 1. WorkerTokenStatusDisplayV8 Integration
**REQUIRED**: Use the V8 component instead of custom implementations.

```tsx
// ✅ CORRECT - Use V8 component
<WorkerTokenStatusDisplayV8
  mode="detailed"
  showRefresh={true}
  showConfig={true}
  refreshInterval={5}
/>

// ❌ INCORRECT - Custom implementation
<div className="card mb-4">
  {/* Custom status display */}
</div>
```

### 2. Icon Standards
Use Ping MDI icons consistently:

| Element | Icon Class | Purpose |
|---------|------------|---------|
| Worker Token | `mdi-key` | Token-related actions |
| Valid Status | `mdi-check-circle` | Success states |
| Invalid Status | `mdi-alert` | Error/warning states |
| Loading | `mdi-loading mdi-spin` | Loading states |
| Refresh | `mdi-refresh` | Refresh actions |
| Configure | `mdi-cog` or `mdi-settings` | Configuration actions |

### 3. Modal Integration
Use WorkerTokenModalV8 for all worker token modals:

```tsx
{showWorkerTokenModal && (
  <WorkerTokenModalV8
    isOpen={showWorkerTokenModal}
    onClose={async () => {
      setShowWorkerTokenModal(false);
      // Update status after modal closes
      await updateTokenStatus();
    }}
  />
)}
```

## 📋 Implementation Checklist

### Before Commit:
- [ ] Worker token button uses dynamic color logic
- [ ] CSS classes `btn-light-green` and `btn-light-red` are defined
- [ ] Token status state is properly implemented
- [ ] Periodic status updates are configured (30-second interval)
- [ ] V8 components are used instead of custom implementations
- [ ] Ping MDI icons are used consistently
- [ ] Modal integration follows the standard pattern

### Testing Checklist:
- [ ] Button is green when token is valid
- [ ] Button is red when token is invalid/expired
- [ ] Button updates color when token status changes
- [ ] Status display shows correct information
- [ ] Modal opens and closes properly
- [ ] Token status updates after modal interaction

## 🚨 Common Regression Points

### 1. Missing CSS Classes
**Problem**: `btn-light-green` or `btn-light-red` classes not defined
**Solution**: Ensure CSS is imported and classes are defined

### 2. Static Button Colors
**Problem**: Button hardcoded to single color
**Solution**: Use ternary operator with `tokenStatus.isValid`

### 3. Missing Status Updates
**Problem**: Token status not updating periodically
**Solution**: Implement useEffect with 30-second interval

### 4. Type Mismatches
**Problem**: `TokenStatusInfo` vs local state type mismatch
**Solution**: Convert types properly in `setTokenStatus` calls

## 📁 File Locations

### Components:
- `src/v8/components/WorkerTokenStatusDisplayV8.tsx`
- `src/v8/components/WorkerTokenModalV8.tsx`
- `src/v8/components/SilentApiConfigCheckboxV8.tsx`
- `src/v8/components/ShowTokenConfigCheckboxV8.tsx`

### Services:
- `src/v8/services/workerTokenStatusServiceV8.ts`
- `src/v8/services/workerTokenServiceV8.ts`

### CSS:
- Global styles should include button color classes
- Component-specific styles should not override button colors

## 🔧 Debugging

### Check Button Color:
```javascript
// In browser console
console.log('Token Status:', tokenStatus);
console.log('Button Class:', tokenStatus.isValid ? 'btn-light-green' : 'btn-light-red');
```

### Check CSS:
```javascript
// Check if classes exist
console.log(getComputedStyle(document.querySelector('.btn-light-green')));
console.log(getComputedStyle(document.querySelector('.btn-light-red')));
```

### Check Token Status:
```javascript
// Verify service is working
WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
  .then(status => console.log('Status:', status))
  .catch(error => console.error('Error:', error));
```

## 📝 Version History

- **v1.0** - Initial standards document
- **v1.1** - Added CSS class definitions
- **v1.2** - Added debugging section
- **v1.3** - Updated component integration patterns

---

**IMPORTANT**: Any changes to worker token UI MUST reference this document and update the version history.
