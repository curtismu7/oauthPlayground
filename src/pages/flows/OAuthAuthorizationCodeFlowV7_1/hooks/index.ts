// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/hooks/index.ts
// V7.1 Hooks Index - Central export for all custom hooks

// Export state management hooks
export { 
  useFlowStateManagement 
} from './useFlowStateManagement';

export { 
  useAuthCodeManagement 
} from './useAuthCodeManagement';

export { 
  useFlowVariantSwitching 
} from './useFlowVariantSwitching';

export { 
  usePerformanceMonitoring,
  useOperationTiming 
} from './usePerformanceMonitoring';

// Re-export for convenience
export { default as FlowStateManagement } from './useFlowStateManagement';
export { default as AuthCodeManagement } from './useAuthCodeManagement';
export { default as FlowVariantSwitching } from './useFlowVariantSwitching';
export { default as PerformanceMonitoring } from './usePerformanceMonitoring';
