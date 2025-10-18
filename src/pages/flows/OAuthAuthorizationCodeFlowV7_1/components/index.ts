// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/index.ts
// V7.1 Components Index - Central export for all refactored components

// Export error boundary
export { 
  FlowErrorBoundary, 
  withFlowErrorBoundary, 
  useFlowErrorBoundary 
} from './FlowErrorBoundary';

// Export error wrapper
export { 
  FlowErrorWrapper 
} from './FlowErrorWrapper';

// Export other components (when refactored)
// export { FlowHeader } from './FlowHeader';
// export { FlowSteps } from './FlowSteps';
// export { FlowConfiguration } from './FlowConfiguration';
// export { FlowResults } from './FlowResults';
// export { FlowNavigation } from './FlowNavigation';

// Re-export for convenience
export { default as ErrorBoundary } from './FlowErrorBoundary';
export { default as ErrorWrapper } from './FlowErrorWrapper';
