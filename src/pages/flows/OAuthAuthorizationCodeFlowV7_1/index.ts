// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/index.ts
// V7.1 Main Index - Central export for the refactored OAuth Authorization Code Flow

// Export constants
export * from './constants';

// Export types
export * from './types';

// Export components
export * from './components';

// Export hooks
export * from './hooks';

// Export main component (when refactored)
// export { default as OAuthAuthorizationCodeFlowV7_1 } from './OAuthAuthorizationCodeFlowV7_1';

// Export other components (when refactored)
// export { FlowHeader } from './components/FlowHeader';
// export { FlowSteps } from './components/FlowSteps';
// export { FlowConfiguration } from './components/FlowConfiguration';
// export { FlowResults } from './components/FlowResults';
// export { FlowNavigation } from './components/FlowNavigation';

// Re-export commonly used items for convenience
export {
  FLOW_CONSTANTS,
  STEP_METADATA,
  STEP_CONFIGS,
  UI_CONSTANTS,
} from './constants';

export type {
  FlowVariant,
  FlowState,
  FlowController,
  FlowCredentials,
  TokenResponse,
  UserInfo,
  PKCECodes,
  StepCompletionState,
} from './types';
