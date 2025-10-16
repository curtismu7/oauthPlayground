// src/components/RAR/index.ts
// RAR (Rich Authorization Requests) UI Components

export { default as AuthorizationDetailsEditor } from '../AuthorizationDetailsEditor';
export { default as RARExampleSelector } from '../RARExampleSelector';
export { default as RARValidationDisplay } from '../RARValidationDisplay';

// Re-export types for convenience
export type { AuthorizationDetail, RARValidationResult } from '../../services/rarService';