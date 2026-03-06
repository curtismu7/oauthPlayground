/**
 * Version Badge Service - Centralized version management for migrated applications
 * 
 * This service provides standardized version badges that automatically use
 * current package.json versions and can be applied to sidebar menu items
 * and application components after migration/standardization.
 */

import React from 'react';
import { VERSION_METADATA } from '../version';
import type { SidebarMenuItem } from '../config/sidebarMenuConfig';

// Version badge types for different application categories
export type VersionBadgeType = 
  | 'v9'        // V9 modern messaging + Ping UI
  | 'v8'        // V8 era applications
  | 'v8u'       // V8 unified applications  
  | 'v7'        // V7 era applications
  | 'legacy'    // Legacy applications
  | 'production' // Production-ready applications
  | 'new'       // Newly created applications
  | 'migrated'  // Recently migrated applications;

export interface VersionBadgeConfig {
  type: VersionBadgeType;
  showVersion?: boolean;
  showBadge?: boolean;
  customLabel?: string;
  customVersion?: string;
}

export interface VersionedMenuItem extends SidebarMenuItem {
  versionBadge?: VersionBadgeConfig;
}

// Version badge styling and configuration
const VERSION_BADGE_CONFIG = {
  v9: {
    color: '#22c55e',      // Green - modern, production-ready
    bgColor: 'rgba(34, 197, 94, 0.9)',
    label: 'V9',
    description: 'V9 Modern Messaging + Ping UI',
  },
  v8: {
    color: '#3b82f6',      // Blue - stable V8
    bgColor: 'rgba(59, 130, 246, 0.9)',
    label: 'V8',
    description: 'V8 Era Applications',
  },
  v8u: {
    color: '#10b981',      // Green - unified V8
    bgColor: 'rgba(16, 185, 129, 0.9)',
    label: 'V8U',
    description: 'V8 Unified Applications',
  },
  v7: {
    color: '#8b5cf6',      // Purple - V7 era
    bgColor: 'rgba(139, 92, 246, 0.9)',
    label: 'V7',
    description: 'V7 Era Applications',
  },
  legacy: {
    color: '#6b7280',      // Gray - legacy
    bgColor: 'rgba(107, 114, 128, 0.9)',
    label: 'LEGACY',
    description: 'Legacy Applications',
  },
  production: {
    color: '#059669',      // Dark green - production
    bgColor: 'rgba(5, 150, 105, 0.9)',
    label: 'PROD',
    description: 'Production Ready',
  },
  new: {
    color: '#ec4899',      // Pink - new
    bgColor: 'rgba(236, 72, 153, 0.9)',
    label: 'NEW',
    description: 'Newly Added',
  },
  migrated: {
    color: '#f59e0b',      // Amber - recently migrated
    bgColor: 'rgba(245, 158, 11, 0.9)',
    label: 'MIGRATED',
    description: 'Recently Migrated',
  },
} as const;

/**
 * Get the current version for a specific application type
 */
export const getVersionForType = (type: VersionBadgeType): string => {
  switch (type) {
    case 'v9':
    case 'production':
    case 'new':
    case 'migrated':
      return VERSION_METADATA.app;
    case 'v8':
      return VERSION_METADATA.mfaV8;
    case 'v8u':
      return VERSION_METADATA.unifiedV8u;
    case 'v7':
    case 'legacy':
      return VERSION_METADATA.app; // V7 uses main app version
    default:
      return VERSION_METADATA.app;
  }
};

/**
 * Create a version badge component
 */
export const createVersionBadge = (config: VersionBadgeConfig): React.ReactElement => {
  const {
    type,
    showVersion = true,
    showBadge = true,
    customLabel,
    customVersion,
  } = config;

  if (!showBadge) return <></>;

  const badgeConfig = VERSION_BADGE_CONFIG[type];
  const version = customVersion || getVersionForType(type);
  const label = customLabel || badgeConfig.label;

  return (
    <span
      className="version-badge"
      style={{
        background: badgeConfig.bgColor,
        border: `1px solid ${badgeConfig.color}`,
        color: '#ffffff',
        padding: '0.125rem 0.375rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      }}
      title={`${badgeConfig.description} ${showVersion ? `v${version}` : ''}`}
    >
      {label}
      {showVersion && ` v${version}`}
    </span>
  );
};

/**
 * Add version badge to sidebar menu item
 */
export const addVersionBadge = (
  item: SidebarMenuItem,
  badgeConfig: VersionBadgeConfig
): VersionedMenuItem => {
  return {
    ...item,
    versionBadge: badgeConfig,
  };
};

/**
 * Apply V9 version badge to migrated applications
 */
export const applyV9Badge = (item: SidebarMenuItem): VersionedMenuItem => {
  return addVersionBadge(item, {
    type: 'v9',
    showVersion: true,
    showBadge: true,
  });
};

/**
 * Apply migrated badge to recently migrated applications
 */
export const applyMigratedBadge = (item: SidebarMenuItem): VersionedMenuItem => {
  return addVersionBadge(item, {
    type: 'migrated',
    showVersion: true,
    showBadge: true,
  });
};

/**
 * Apply legacy badge to non-migrated applications
 */
export const applyLegacyBadge = (item: SidebarMenuItem): VersionedMenuItem => {
  return addVersionBadge(item, {
    type: 'legacy',
    showVersion: false,
    showBadge: true,
  });
};

/**
 * Determine version badge type based on migration status
 */
export const determineBadgeType = (
  migratedToV9: boolean,
  recentlyMigrated: boolean = false
): VersionBadgeType => {
  if (recentlyMigrated) return 'migrated';
  if (migratedToV9) return 'v9';
  return 'legacy';
};

/**
 * Automatically apply appropriate version badge to menu item
 */
export const autoApplyVersionBadge = (
  item: SidebarMenuItem,
  recentlyMigrated: boolean = false
): VersionedMenuItem => {
  const badgeType = determineBadgeType(!!item.migratedToV9, recentlyMigrated);
  return addVersionBadge(item, {
    type: badgeType,
    showVersion: badgeType !== 'legacy',
    showBadge: true,
  });
};

/**
 * Version badge renderer for sidebar menu items
 */
export const renderVersionBadge = (item: VersionedMenuItem): React.ReactNode => {
  if (!item.versionBadge?.showBadge) return null;
  return createVersionBadge(item.versionBadge);
};

/**
 * Get version badge styling for CSS
 */
export const getVersionBadgeStyles = (type: VersionBadgeType) => {
  const config = VERSION_BADGE_CONFIG[type];
  return {
    '--badge-color': config.color,
    '--badge-bg-color': config.bgColor,
    '--badge-label': config.label,
  };
};

/**
 * Update sidebar menu items with version badges
 */
export const updateMenuItemsWithVersionBadges = (
  items: SidebarMenuItem[],
  recentlyMigratedIds: string[] = []
): VersionedMenuItem[] => {
  return items.map(item => {
    const isRecentlyMigrated = recentlyMigratedIds.includes(item.id);
    return autoApplyVersionBadge(item, isRecentlyMigrated);
  });
};

/**
 * Version badge context for application-wide version management
 */
export interface VersionBadgeContext {
  currentVersions: {
    app: string;
    mfaV8: string;
    unifiedV8u: string;
  };
  updateBadge: (itemId: string, config: VersionBadgeConfig) => void;
  getBadgeConfig: (itemId: string) => VersionBadgeConfig | undefined;
}

/**
 * CSS styles for version badges (can be imported into CSS files)
 */
export const VERSION_BADGE_CSS = `
.version-badge {
  transition: all 0.2s ease;
}

.version-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Version badge variations */
.version-badge--v9 {
  --badge-color: #22c55e;
  --badge-bg-color: rgba(34, 197, 94, 0.9);
}

.version-badge--migrated {
  --badge-color: #f59e0b;
  --badge-bg-color: rgba(245, 158, 11, 0.9);
}

.version-badge--legacy {
  --badge-color: #6b7280;
  --badge-bg-color: rgba(107, 114, 128, 0.9);
}
`;

export default {
  VERSION_BADGE_CONFIG,
  createVersionBadge,
  addVersionBadge,
  applyV9Badge,
  applyMigratedBadge,
  applyLegacyBadge,
  determineBadgeType,
  autoApplyVersionBadge,
  renderVersionBadge,
  getVersionBadgeStyles,
  updateMenuItemsWithVersionBadges,
  VERSION_BADGE_CSS,
};
