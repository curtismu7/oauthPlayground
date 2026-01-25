/**
 * @file workerTokenStatusServiceV8U.ts
 * @module v8u/services
 * @description Service for managing worker token status display and styling across V8U components
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Worker Token Status Service - Centralized status management and styling
 *
 * This service provides:
 * - Status text generation and formatting
 * - Color scheme management for different status types
 * - Styling constants for consistent appearance
 * - Status validation and checking utilities
 *
 * Why a service?
 * - Centralized status logic - single source of truth for status handling
 * - Consistent styling - same colors and text across all components
 * - Easy maintenance - change colors/text in one place
 * - Reusable logic - status calculations available everywhere
 */

// Local interface for TokenStatusInfo to avoid circular dependencies
export interface TokenStatusInfo {
  isValid: boolean;
  status: 'valid' | 'expired' | 'missing' | 'invalid' | string;
  message: string;
  expiresAt: number | null;
  issuedAt?: number | null;
  minutesRemaining?: number;
  lastUsed?: number | null;
}

const MODULE_TAG = '[🔧 WORKER-TOKEN-STATUS-V8U]';

// Status types for consistent typing
export type WorkerTokenStatusType = 'valid' | 'invalid' | 'warning';

// Status variant for styling
export type WorkerTokenStatusVariant = 'valid' | 'invalid' | 'warning';

// Color scheme for status display
export interface WorkerTokenStatusColors {
  primary: string;
  secondary: string;
  background: string;
  border: string;
  text: string;
  shadow: string;
}

// Status display configuration
export interface WorkerTokenStatusConfig {
  text: string;
  variant: WorkerTokenStatusVariant;
  colors: WorkerTokenStatusColors;
  icon: string;
  description: string;
}

/**
 * Get status variant from token status
 */
export function getWorkerTokenStatusVariant(tokenStatus: TokenStatusInfo): WorkerTokenStatusVariant {
  if (tokenStatus.isValid) return 'valid';
  if (tokenStatus.status === 'expired') return 'warning';
  return 'invalid';
}

/**
 * Get status text from token status
 */
export function getWorkerTokenStatusText(tokenStatus: TokenStatusInfo): string {
  if (tokenStatus.isValid) return 'ACTIVE';
  if (tokenStatus.status === 'expired') return 'EXPIRED';
  if (tokenStatus.status === 'missing') return 'MISSING';
  return tokenStatus.status?.toUpperCase() || 'UNKNOWN';
}

/**
 * Get color scheme for status variant
 */
export function getWorkerTokenStatusColors(variant: WorkerTokenStatusVariant): WorkerTokenStatusColors {
  switch (variant) {
    case 'valid':
      return {
        primary: '#047857',
        secondary: '#10b981',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '#10b981',
        text: '#047857',
        shadow: 'rgba(16, 185, 129, 0.2)'
      };
    case 'warning':
      return {
        primary: '#b45309',
        secondary: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '#f59e0b',
        text: '#b45309',
        shadow: 'rgba(245, 158, 11, 0.2)'
      };
    case 'invalid':
      return {
        primary: '#b91c1c',
        secondary: '#ef4444',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '#ef4444',
        text: '#b91c1c',
        shadow: 'rgba(239, 68, 68, 0.2)'
      };
    default:
      return getWorkerTokenStatusColors('invalid');
  }
}

/**
 * Get complete status configuration
 */
export function getWorkerTokenStatusConfig(tokenStatus: TokenStatusInfo): WorkerTokenStatusConfig {
  const variant = getWorkerTokenStatusVariant(tokenStatus);
  const colors = getWorkerTokenStatusColors(variant);
  const text = getWorkerTokenStatusText(tokenStatus);

  return {
    text,
    variant,
    colors,
    icon: getStatusIcon(variant),
    description: getStatusDescription(tokenStatus)
  };
}

/**
 * Get icon name for status variant
 */
function getStatusIcon(variant: WorkerTokenStatusVariant): string {
  switch (variant) {
    case 'valid':
      return 'FiCheckCircle';
    case 'warning':
      return 'FiClock';
    case 'invalid':
      return 'FiXCircle';
    default:
      return 'FiXCircle';
  }
}

/**
 * Get status description
 */
function getStatusDescription(tokenStatus: TokenStatusInfo): string {
  if (tokenStatus.isValid) {
    return 'Worker token is valid and ready for use';
  }
  
  switch (tokenStatus.status) {
    case 'expired':
      return 'Worker token has expired and needs renewal';
    case 'missing':
      return 'No worker token available - please obtain one';
    case 'invalid':
      return 'Worker token is invalid or corrupted';
    default:
      return 'Worker token status unknown';
  }
}

/**
 * Format time remaining for display
 */
export function formatWorkerTokenTimeRemaining(tokenStatus: TokenStatusInfo): string {
  if (!tokenStatus.expiresAt) return 'No expiration';
  
  const now = Date.now();
  const remaining = tokenStatus.expiresAt - now;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

/**
 * Get token age for display
 */
export function getWorkerTokenAge(tokenStatus: TokenStatusInfo): string {
  if (!tokenStatus.issuedAt) return 'Unknown';
  
  const now = Date.now();
  const age = now - tokenStatus.issuedAt;
  
  const hours = Math.floor(age / (1000 * 60 * 60));
  const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

/**
 * Check if token needs refresh
 */
export function shouldRefreshWorkerToken(tokenStatus: TokenStatusInfo): boolean {
  if (!tokenStatus.isValid || !tokenStatus.expiresAt) return true;
  
  const now = Date.now();
  const remaining = tokenStatus.expiresAt - now;
  
  // Refresh if less than 5 minutes remaining
  return remaining < 5 * 60 * 1000;
}

/**
 * Get status styling constants for CSS-in-JS
 */
export const WORKER_TOKEN_STATUS_STYLES = {
  // StatusValue component colors
  statusValue: {
    valid: '#047857',
    warning: '#b45309',
    invalid: '#b91c1c'
  },
  
  // DetailValue component colors
  detailValue: {
    normal: '#d1d5db',
    highlight: '#047857'
  },
  
  // StatusLabel colors
  statusLabel: '#9ca3af',
  
  // Common shadows
  shadows: {
    text: '0 1px 2px rgba(0, 0, 0, 0.3)',
    drop: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))',
    detail: '0 1px 2px rgba(0, 0, 0, 0.2)'
  },
  
  // Container backgrounds
  backgrounds: {
    valid: 'rgba(16, 185, 129, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
    invalid: 'rgba(239, 68, 68, 0.1)'
  },
  
  // Border colors
  borders: {
    valid: '#10b981',
    warning: '#f59e0b',
    invalid: '#ef4444'
  }
} as const;

/**
 * Debug utility to log status information
 */
export function debugWorkerTokenStatus(tokenStatus: TokenStatusInfo, context?: string): void {
  const config = getWorkerTokenStatusConfig(tokenStatus);
  const contextStr = context ? ` (${context})` : '';
  console.log(`${MODULE_TAG} Status Debug${contextStr}`, {
    status: tokenStatus.status,
    isValid: tokenStatus.isValid,
    variant: config.variant,
    text: config.text,
    colors: config.colors,
    expiresAt: tokenStatus.expiresAt ? new Date(tokenStatus.expiresAt).toISOString() : null,
    issuedAt: tokenStatus.issuedAt ? new Date(tokenStatus.issuedAt).toISOString() : null
  });
}

// Export default service object for convenience
export const WorkerTokenStatusServiceV8U = {
  getVariant: getWorkerTokenStatusVariant,
  getText: getWorkerTokenStatusText,
  getColors: getWorkerTokenStatusColors,
  getConfig: getWorkerTokenStatusConfig,
  formatTimeRemaining: formatWorkerTokenTimeRemaining,
  getAge: getWorkerTokenAge,
  shouldRefresh: shouldRefreshWorkerToken,
  debug: debugWorkerTokenStatus,
  styles: WORKER_TOKEN_STATUS_STYLES
} as const;

export default WorkerTokenStatusServiceV8U;
