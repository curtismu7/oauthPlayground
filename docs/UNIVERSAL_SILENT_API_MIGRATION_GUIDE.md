# Universal Silent API Migration Guide

## Overview

This guide helps migrate existing Silent API and Show Token functionality to the new `UniversalSilentApiService`. This consolidation eliminates code duplication and provides consistent behavior across all apps.

## 🎯 Migration Goals

1. **Single Source of Truth**: One service for all Silent API and Show Token functionality
2. **Consistent Behavior**: Same logic across V8, V8U, and V8M apps  
3. **Unified Storage**: Uses the new unified storage service
4. **Event-Driven Updates**: Automatic synchronization across components
5. **Type Safety**: Full TypeScript support with proper interfaces

## 📋 Migration Checklist

### Phase 1: Replace Existing Services
- [ ] Replace `useSilentApiConfigV8` hook usage
- [ ] Replace `WorkerTokenConfigServiceV8` direct usage
- [ ] Update component state management
- [ ] Replace localStorage direct access

### Phase 2: Update Component Logic
- [ ] Update checkbox event handlers
- [ ] Update token retrieval logic
- [ ] Update modal display logic
- [ ] Update error handling

### Phase 3: Testing & Validation
- [ ] Test silent API functionality
- [ ] Test show token at end behavior
- [ ] Test mutual exclusivity logic
- [ ] Test cross-component synchronization

## 🔄 Migration Examples

### Before (V8 Hook)
```typescript
// Old way
import { useWorkerTokenConfigV8 } from '@/v8/hooks/useSilentApiConfigV8';

const MyComponent = () => {
  const { config, updateConfig } = useWorkerTokenConfigV8();
  
  const handleSilentApiToggle = () => {
    updateConfig({ silentApiRetrieval: !config.silentApiRetrieval });
  };
  
  const handleGetToken = async () => {
    if (config.silentApiRetrieval) {
      // Manual silent retrieval logic
      const token = await workerTokenServiceV8.getToken();
      // ... handle result
    } else {
      // Show modal
      setShowModal(true);
    }
  };
};
```

### After (Universal Hook)
```typescript
// New way
import { useV8SilentApi } from '@/hooks/useUniversalSilentApi';

const MyComponent = () => {
  const { 
    config, 
    toggleSilentApi, 
    getWorkerToken,
    isLoading,
    error 
  } = useV8SilentApi();
  
  const handleGetToken = async () => {
    const result = await getWorkerToken();
    
    if (result.token) {
      // Token retrieved successfully
      console.log('Token:', result.token);
    }
    
    if (result.showModal) {
      // Show token modal
      setShowModal(true);
    }
    
    if (result.error) {
      // Handle error
      console.error('Error:', result.error);
    }
  };
};
```

### Service Migration

### Before (Direct Service Usage)
```typescript
// Old way
import { WorkerTokenConfigServiceV8 } from '@/v8/services/workerTokenConfigServiceV8';

class MyService {
  private updateConfig() {
    const config = WorkerTokenConfigServiceV8.getConfig();
    WorkerTokenConfigServiceV8.updateConfig({
      silentApiRetrieval: !config.silentApiRetrieval
    });
  }
  
  private async getToken() {
    const config = WorkerTokenConfigServiceV8.getConfig();
    if (config.silentApiRetrieval) {
      return await workerTokenServiceV8.getToken();
    }
    throw new Error('Silent API disabled');
  }
}
```

### After (Universal Service)
```typescript
// New way
import { v8SilentApiService } from '@/services/universalSilentApiService';

class MyService {
  private updateConfig() {
    v8SilentApiService.toggleSilentApi();
  }
  
  private async getToken() {
    const result = await v8SilentApiService.getWorkerToken();
    if (result.token) {
      return result.token;
    }
    throw new Error(result.error || 'Token retrieval failed');
  }
}
```

## 🏗️ Architecture Changes

### Old Architecture
```
V8 Hook → V8 Config Service → localStorage
V8U Hook → V8U Config Service → localStorage  
V8M Hook → V8M Config Service → localStorage
```

### New Architecture
```
Universal Hook → Universal Service → Unified Storage
     ↓
Event-driven updates across all components
```

## 📦 Available Services

### Universal Service
```typescript
import { universalSilentApiService } from '@/services/universalSilentApiService';
```

### App-Specific Services
```typescript
import { 
  v8SilentApiService,
  v8uSilentApiService, 
  v8mSilentApiService 
} from '@/services/universalSilentApiService';
```

### React Hooks
```typescript
import { 
  useUniversalSilentApi,
  useV8SilentApi,
  useV8USilentApi,
  useV8MSilentApi 
} from '@/hooks/useUniversalSilentApi';
```

## 🔧 Configuration Options

### Service Configuration
```typescript
const service = new UniversalSilentApiService({
  appId: 'my-app',
  appName: 'My Application',
  appVersion: '1.0.0',
  storageKey: 'custom_storage_key' // Optional
});
```

### Hook Configuration
```typescript
const { config, updateConfig } = useUniversalSilentApi({
  appId: 'my-app',
  appName: 'My Application', 
  appVersion: '1.0.0',
  storageKey: 'custom_storage_key', // Optional
  autoSync: true // Default: true
});
```

## 🎛️ API Reference

### UniversalSilentApiService

#### Methods
- `getConfig(): UniversalSilentApiConfig`
- `saveConfig(config: UniversalSilentApiConfig): void`
- `updateConfig(updates: Partial<UniversalSilentApiConfig>): UniversalSilentApiConfig`
- `executeSilentApi(): Promise<SilentApiResult>`
- `getWorkerToken(options): Promise<{token?, showModal, error?}>`
- `toggleSilentApi(): UniversalSilentApiConfig`
- `toggleShowTokenAtEnd(): UniversalSilentApiConfig`
- `resetConfig(): UniversalSilentApiConfig`
- `isSilentApiEnabled(): boolean`
- `isShowTokenAtEndEnabled(): boolean`
- `getStatus(): ServiceStatus`

### React Hook

#### Returns
```typescript
interface UseUniversalSilentApiReturn {
  // State
  config: UniversalSilentApiConfig;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateConfig: (updates: Partial<UniversalSilentApiConfig>) => void;
  toggleSilentApi: () => void;
  toggleShowTokenAtEnd: () => void;
  resetConfig: () => void;
  
  // Token Operations
  executeSilentApi: () => Promise<SilentApiResult>;
  getWorkerToken: (options?) => Promise<{token?, showModal, error?}>;
  
  // Status
  isSilentApiEnabled: () => boolean;
  isShowTokenAtEndEnabled: () => boolean;
  getStatus: () => ServiceStatus;
}
```

## 🔄 Event System

The universal service uses custom events for cross-component synchronization:

```typescript
// Listen for config updates
window.addEventListener('universalSilentApiConfigUpdated', (event) => {
  const { appId, config, timestamp } = event.detail;
  console.log(`Config updated for ${appId}:`, config);
});

// Service automatically broadcasts updates
service.updateConfig({ silentApiRetrieval: true });
// → Triggers 'universalSilentApiConfigUpdated' event
```

## 🧪 Testing

### Unit Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useUniversalSilentApi } from '@/hooks/useUniversalSilentApi';

test('should toggle silent API', async () => {
  const { result } = renderHook(() => useUniversalSilentApi({ appId: 'test' }));
  
  act(() => {
    result.current.toggleSilentApi();
  });
  
  expect(result.current.config.silentApiRetrieval).toBe(true);
  expect(result.current.config.showTokenAtEnd).toBe(false); // Mutual exclusivity
});
```

### Integration Tests
```typescript
import { v8SilentApiService } from '@/services/universalSilentApiService';

test('should execute silent API', async () => {
  // Enable silent API
  v8SilentApiService.updateConfig({ silentApiRetrieval: true });
  
  // Execute
  const result = await v8SilentApiService.executeSilentApi();
  
  expect(result.success).toBe(true);
  expect(result.token).toBeDefined();
  expect(result.wasSilent).toBe(true);
});
```

## 🚨 Breaking Changes

### Removed
- Direct `WorkerTokenConfigServiceV8` usage
- Manual localStorage access for config
- Separate config services per app

### Changed
- Configuration keys now use `universal_silent_api_{appId}` format
- Mutual exclusivity is automatically enforced
- Event system replaces manual state synchronization

### Added
- Universal service with unified API
- React hooks for easy integration
- Event-driven configuration updates
- Comprehensive error handling and logging

## 📚 Migration Timeline

### Week 1: Foundation
- [ ] Deploy universal service
- [ ] Create migration guide
- [ ] Set up testing framework

### Week 2: V8 Migration  
- [ ] Update V8 components
- [ ] Update V8 services
- [ ] Test V8 functionality

### Week 3: V8U Migration
- [ ] Update V8U components
- [ ] Update V8U services  
- [ ] Test V8U functionality

### Week 4: V8M Migration & Cleanup
- [ ] Update V8M components
- [ ] Update V8M services
- [ ] Remove old services
- [ ] Final testing

## 🆘 Troubleshooting

### Common Issues

#### Service Not Initialized
```typescript
// Problem: Service is null when hook first renders
// Solution: Check service exists before using

const { getWorkerToken } = useUniversalSilentApi();

const handleGetToken = async () => {
  try {
    const result = await getWorkerToken();
    // Handle result
  } catch (error) {
    if (error.message.includes('Service not initialized')) {
      // Service still loading, try again or show loading state
      return;
    }
    // Handle other errors
  }
};
```

#### Configuration Not Syncing
```typescript
// Problem: Changes in one component not reflected in another
// Solution: Ensure autoSync is enabled and components use same appId

const hook1 = useUniversalSilentApi({ appId: 'shared-app', autoSync: true });
const hook2 = useUniversalSilentApi({ appId: 'shared-app', autoSync: true });
// Both hooks will receive updates
```

#### Storage Key Conflicts
```typescript
// Problem: Different apps overwriting each other's config
// Solution: Use unique appId for each app

const v8Hook = useUniversalSilentApi({ appId: 'v8' });
const v8uHook = useUniversalSilentApi({ appId: 'v8u' });
// Each app gets its own storage: universal_silent_api_v8, universal_silent_api_v8u
```

## 📞 Support

For migration questions or issues:
1. Check this guide first
2. Review the API documentation
3. Check existing test cases
4. Create an issue with detailed reproduction steps

---

**Migration Status**: 🟡 In Progress  
**Target Completion**: Week 4 of Sprint  
**Contact**: Development Team
