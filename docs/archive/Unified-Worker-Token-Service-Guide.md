# Unified Worker Token Service V8 - Migration Guide

## 🎯 Overview

The `UnifiedWorkerTokenService` combines all worker token functionality into a single, reusable component:
- ✅ **Get Worker Token button**
- ✅ **Real-time token status display**  
- ✅ **Settings management** (Silent API retrieval, Show token at end)
- ✅ **Automatic updates and synchronization**
- ✅ **Multiple display modes** (compact, detailed, minimal)

## 🔄 Migration Benefits

### **Before (Duplicated Components)**
```typescript
// ❌ Multiple separate components
<WorkerTokenStatusDisplay mode="compact" showRefresh={true} />
<WorkerTokenSettings settings={settings} onSettingsChange={handleSettingsChange} />
<ActionButton onClick={handleGetWorkerToken}>Get Worker Token</ActionButton>

// ❌ Duplicated state management
const [tokenStatus, setTokenStatus] = useState();
const [settings, setSettings] = useState();
const [isLoading, setIsLoading] = useState();

// ❌ Duplicated event listeners
useEffect(() => {
  window.addEventListener('workerTokenUpdated', handleTokenUpdate);
  window.addEventListener('workerTokenSettingsUpdated', handleSettingsUpdate);
  return () => {
    window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
    window.removeEventListener('workerTokenSettingsUpdated', handleSettingsUpdate);
  };
}, []);
```

### **After (Unified Service)**
```typescript
// ✅ Single unified component
<UnifiedWorkerTokenService 
  mode="detailed"
  showRefresh={true}
  onTokenUpdate={handleTokenUpdate}
  onSettingsChange={handleSettingsChange}
/>

// ✅ No state management needed - handled internally
// ✅ No event listeners needed - handled internally
// ✅ Automatic updates and synchronization
```

## 📋 Component API

### **Props Interface**
```typescript
export interface UnifiedWorkerTokenServiceV8Props {
  mode?: 'compact' | 'detailed' | 'minimal';  // Display mode
  showRefresh?: boolean;                      // Show refresh button
  className?: string;                         // Custom CSS classes
  onTokenUpdate?: (status: TokenStatusInfo) => void;    // Token update callback
  onSettingsChange?: (settings: WorkerTokenSettings) => void; // Settings change callback
}
```

### **Display Modes**

#### **Detailed Mode** (Default)
- Full token status with expiration info
- Get/Manage Worker Token button
- Settings checkboxes with descriptions
- Real-time updates every 30 seconds

```typescript
<UnifiedWorkerTokenService mode="detailed" />
```

#### **Compact Mode**
- Status badge and message
- Get/Manage Worker Token button
- Refresh button
- Clean, minimal layout

```typescript
<UnifiedWorkerTokenService mode="compact" />
```

#### **Minimal Mode**
- Just status badge and icon
- Refresh button (optional)
- Perfect for headers or tight spaces

```typescript
<UnifiedWorkerTokenService mode="minimal" />
```

## 🚀 Usage Examples

### **Basic Usage**
```typescript
import { UnifiedWorkerTokenService } from '@/v8/services/unifiedWorkerTokenService';

function MyComponent() {
  return (
    <UnifiedWorkerTokenService 
      mode="detailed"
      showRefresh={true}
    />
  );
}
```

### **With Callbacks**
```typescript
function MyComponent() {
  const handleTokenUpdate = (status) => {
    console.log('Token status updated:', status);
    // Update parent state if needed
  };

  const handleSettingsChange = (settings) => {
    console.log('Settings changed:', settings);
    // Update parent state if needed
  };

  return (
    <UnifiedWorkerTokenService 
      mode="compact"
      onTokenUpdate={handleTokenUpdate}
      onSettingsChange={handleSettingsChange}
    />
  );
}
```

### **In Different Contexts**

#### **Dashboard Widget**
```typescript
<UnifiedWorkerTokenService 
  mode="minimal"
  showRefresh={false}
  className="dashboard-widget"
/>
```

#### **Settings Page**
```typescript
<UnifiedWorkerTokenService 
  mode="detailed"
  showRefresh={true}
  onSettingsChange={(settings) => {
    // Sync with parent settings
    updateAppSettings(settings);
  }}
/>
```

#### **Modal/Popup**
```typescript
<UnifiedWorkerTokenService 
  mode="compact"
  showRefresh={false}
/>
```

## 🔄 Migration Steps

### **Step 1: Replace Multiple Components**

**Before:**
```typescript
// TokenStatusPageV8U.tsx
<WorkerTokenStatusDisplay mode="compact" showRefresh={true} />
<WorkerTokenSettings settings={workerTokenSettings} onSettingsChange={handleWorkerTokenSettingsChange} />
<ActionButton onClick={handleShowWorkerTokenModal}>Get Worker Token</ActionButton>
```

**After:**
```typescript
// TokenStatusPageV8U.tsx
<UnifiedWorkerTokenService 
  mode="detailed"
  showRefresh={true}
  onTokenUpdate={setTokenStatus}
  onSettingsChange={setWorkerTokenSettings}
/>
```

### **Step 2: Remove Duplicated State**

**Before:**
```typescript
// Remove these state variables
const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>();
const [workerTokenSettings, setWorkerTokenSettings] = useState<WorkerTokenSettings>();
const [isLoading, setIsLoading] = useState(false);

// Remove these event listeners
useEffect(() => {
  window.addEventListener('workerTokenUpdated', handleTokenUpdate);
  window.addEventListener('workerTokenSettingsUpdated', handleSettingsUpdate);
  return () => {
    window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
    window.removeEventListener('workerTokenSettingsUpdated', handleSettingsUpdate);
  };
}, []);

// Remove these handlers
const handleShowWorkerTokenModal = async () => { /* ... */ };
const handleWorkerTokenSettingsChange = async () => { /* ... */ };
const refreshStatus = async () => { /* ... */ };
```

**After:**
```typescript
// No state management needed - handled internally
// No event listeners needed - handled internally
// No handlers needed - handled internally
```

### **Step 3: Update Imports**

**Before:**
```typescript
import { WorkerTokenStatusDisplay } from '@/v8/components/WorkerTokenStatusDisplay';
import { WorkerTokenSettings } from '@/v8/components/WorkerTokenSettings';
import { WorkerTokenStatusService } from '@/v8/services/workerTokenStatusService';
```

**After:**
```typescript
import { UnifiedWorkerTokenService } from '@/v8/services/unifiedWorkerTokenService';
```

## 📊 Impact Analysis

### **Files Affected**
- ✅ **TokenStatusPageV8U.tsx** - Replace 3 components with 1
- ✅ **CredentialsFormV8U.tsx** - Replace 3 components with 1
- ✅ **Any other pages** using worker token components

### **Code Reduction**
- 🗑️ **~300 lines** of duplicated component code
- 🗑️ **~100 lines** of duplicated state management
- 🗑️ **~50 lines** of duplicated event handling
- 🗑️ **~450 lines total** removed

### **Maintenance Benefits**
- ✅ **Single component** to maintain instead of 3
- ✅ **Single source of truth** for all worker token functionality
- ✅ **Consistent behavior** across all pages
- ✅ **Easier testing** with isolated component
- ✅ **Better performance** with optimized updates

### **User Experience**
- ✅ **Consistent UI** across all pages
- ✅ **Real-time updates** (30-second intervals)
- ✅ **Better error handling** and user feedback
- ✅ **Responsive design** for all screen sizes
- ✅ **Accessibility** with proper ARIA labels

## 🎯 Advanced Features

### **Automatic Silent Retrieval**
The unified service automatically handles silent retrieval when enabled:

```typescript
// When user enables "Silent API Retrieval"
if (newSettings.silentApiRetrieval && !settings.silentApiRetrieval) {
  if (!tokenStatus?.isValid) {
    // Automatically fetch token in background
    await handleShowWorkerTokenModal(...);
  }
}
```

### **Real-time Synchronization**
All instances automatically sync when settings change:

```typescript
// Any component can listen for changes
<UnifiedWorkerTokenService 
  onSettingsChange={(settings) => {
    // Sync with other parts of the app
    updateGlobalSettings(settings);
  }}
/>
```

### **Smart Button States**
The button automatically adapts based on token status:

```typescript
// Shows "Get Worker Token" when no token
// Shows "Manage Worker Token" when token exists
// Automatically disables during loading
```

## 🧪 Testing

### **Unit Testing**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedWorkerTokenService } from '@/v8/services/unifiedWorkerTokenService';

describe('UnifiedWorkerTokenService', () => {
  it('should display token status', async () => {
    render(<UnifiedWorkerTokenService mode="compact" />);
    
    expect(screen.getByText('Worker Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get worker token/i })).toBeInTheDocument();
  });

  it('should handle settings changes', async () => {
    const onSettingsChange = jest.fn();
    render(<UnifiedWorkerTokenService mode="detailed" onSettingsChange={onSettingsChange} />);
    
    const silentCheckbox = screen.getByLabelText(/silent api retrieval/i);
    fireEvent.click(silentCheckbox);
    
    expect(onSettingsChange).toHaveBeenCalledWith({
      silentApiRetrieval: true,
      showTokenAtEnd: false
    });
  });
});
```

### **Integration Testing**
```typescript
// Test real token retrieval
it('should get worker token when button clicked', async () => {
  render(<UnifiedWorkerTokenService mode="compact" />);
  
  const button = screen.getByRole('button', { name: /get worker token/i });
  fireEvent.click(button);
  
  // Should show modal and update status
  await waitFor(() => {
    expect(screen.getByText(/manage worker token/i)).toBeInTheDocument();
  });
});
```

## 🎉 Summary

The `UnifiedWorkerTokenService` provides:

- ✅ **Complete functionality** in a single component
- ✅ **Zero duplication** across pages
- ✅ **Automatic updates** and synchronization
- ✅ **Multiple display modes** for different contexts
- ✅ **Better performance** and user experience
- ✅ **Easier maintenance** and testing

**Migration Status: READY FOR IMPLEMENTATION** 🚀

This unified service eliminates all worker token component duplication while providing enhanced functionality and a better user experience!
