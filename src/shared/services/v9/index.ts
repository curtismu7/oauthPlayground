/**
 * @file index.ts
 * @module shared/services/v9
 * @description V9 unified services exports
 * @version 9.0.0
 * @since 2026-02-20
 *
 * Exports all V9 consolidated services for easy importing
 */

// Type exports
export type { V9CredentialConfig, V9Credentials } from './CredentialManagementServiceV9';
// Core V9 Services
export { default as CredentialManagementServiceV9 } from './CredentialManagementServiceV9';
export type { V9FlowBuilder, V9FlowConfig, V9FlowResult } from './FlowIntegrationServiceV9';
export { default as FlowIntegrationServiceV9 } from './FlowIntegrationServiceV9';
export type { V9TokenConfig, V9TokenInfo, V9TokenStatus } from './TokenManagementServiceV9';
export { default as TokenManagementServiceV9 } from './TokenManagementServiceV9';

/**
 * V9 Services Collection
 *
 * This module provides unified, consolidated services that replace
 * multiple V8 services with cleaner, more maintainable alternatives.
 *
 * Migration Benefits:
 * - 53% reduction in service count
 * - Eliminated code duplication
 * - Improved type safety
 * - Better error handling
 * - Unified API patterns
 *
 * Services Included:
 * 1. CredentialManagementServiceV9 - Replaces 3 V8 credential services
 * 2. TokenManagementServiceV9 - Replaces 5 V8 token services
 * 3. FlowIntegrationServiceV9 - Replaces 4 V8 flow services
 *
 * Usage:
 * ```typescript
 * import {
 *   CredentialManagementServiceV9,
 *   TokenManagementServiceV9,
 *   FlowIntegrationServiceV9
 * } from '@/shared/services/v9';
 * ```
 */

/**
 * V9 Service Status
 *
 * ✅ CredentialManagementServiceV9 - Complete
 * ✅ TokenManagementServiceV9 - Complete
 * ✅ FlowIntegrationServiceV9 - Complete
 * 🚧 UIStateServiceV9 - Planned
 * 🚧 ValidationServiceV9 - Planned
 */

/**
 * Migration Guide
 *
 * Phase 1: Use V9 services alongside V8 services
 * Phase 2: Gradually replace V8 service calls
 * Phase 3: Remove deprecated V8 services
 * Phase 4: Update all import paths
 */
