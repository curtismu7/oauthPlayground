# 📋 Version Management Standardization Guide

## Overview

This guide establishes the standard process for managing version numbers and version badges across applications after migration and standardization. It ensures consistent version tracking, proper App.tsx updates, and accurate side menu version indicators.

## 🎯 Objectives

### Primary Goals
- **Version Synchronization**: Keep all version numbers synchronized across components
- **Automatic Updates**: Ensure version badges automatically use current package.json versions
- **Migration Tracking**: Clearly indicate which applications have been migrated to V9
- **User Experience**: Provide clear version information in the side menu and application UI

### Secondary Goals
- **Development Efficiency**: Automate version management wherever possible
- **Documentation**: Maintain clear version history and migration records
- **Quality Assurance**: Prevent version inconsistencies and manual errors

## 🏗️ Version Architecture

### Version Sources
```typescript
// package.json - Single source of truth
{
  "version": "9.13.0",           // Main application version
  "mfaV8Version": "9.13.0",    // MFA V8 version
  "unifiedV8uVersion": "9.13.0", // Unified V8U version
  "protectPortalVersion": "9.11.88" // Protect Portal version
}
```

### Version Service
```typescript
// src/version.ts - Centralized version management
export const VERSION_METADATA = {
  app: "9.13.0",
  ui: "9.13.0", 
  server: "9.13.0",
  logs: "9.13.0",
  mfaV8: "9.13.0",
  unifiedV8u: "9.13.0",
} as const;
```

### Version Badge System
```typescript
// src/components/VersionBadgeService.tsx - Automated version badges
export const createVersionBadge = (config: VersionBadgeConfig) => {
  // Automatically uses current package.json versions
  // Applies appropriate styling based on migration status
  // Renders consistent version indicators
};
```

## 📋 Version Badge Types

### Badge Categories
| Type | Color | Use Case | Version Display |
|------|-------|----------|-----------------|
| **V9** | 🟢 Green | V9 modern messaging + Ping UI | ✅ Show version |
| **V8** | 🔵 Blue | V8 era applications | ✅ Show version |
| **V8U** | 🟢 Green | V8 unified applications | ✅ Show version |
| **V7** | 🟣 Purple | V7 era applications | ✅ Show version |
| **Migrated** | 🟡 Amber | Recently migrated | ✅ Show version |
| **Legacy** | ⚪ Gray | Non-migrated applications | ❌ No version |
| **Production** | 🟢 Dark Green | Production-ready | ✅ Show version |
| **New** | 🩷 Pink | Newly added applications | ✅ Show version |

### Automatic Badge Assignment
```typescript
// Based on migration status in sidebarMenuConfig.ts
const badgeType = determineBadgeType(!!item.migratedToV9, recentlyMigrated);

// V9 migrated applications get V9 badge
if (item.migratedToV9) {
  return applyV9Badge(item); // Green badge with current version
}

// Non-migrated applications get Legacy badge
return applyLegacyBadge(item); // Gray badge, no version
```

## 🔄 Version Update Process

### After Migration/Standardization

#### Step 1: Update Package Version
```bash
# Update all version fields together
npm version patch  # 9.13.0 → 9.13.1
# Or manually update package.json:
{
  "version": "9.13.1",
  "mfaV8Version": "9.13.1", 
  "unifiedV8uVersion": "9.13.1"
}
```

#### Step 2: Update Sidebar Configuration
```typescript
// src/config/sidebarMenuConfig.ts
// Add migratedToV9: true to migrated applications
['/flows/example-app', 'Example App', true] // ← Added true
```

#### Step 3: Verify Version Badges
```typescript
// Version badges automatically update
// V9 applications: Green "V9 v9.13.1" badge
// Legacy applications: Gray "LEGACY" badge
```

#### Step 4: Update App.tsx (if needed)
```typescript
// App.tsx automatically uses package.json versions
// No manual updates required for version display
import { VERSION_METADATA } from './version';
```

#### Step 5: Verify Logging Implementation (NEW)
```typescript
// Verify logging is properly implemented
import { logger } from './services/loggingService';
import { secureLog } from './utils/secureLogging';

// Check for proper API call logging, user action logging, and secure data handling
```

### Version Synchronization Rules

#### ✅ Always Update Together
1. **Main Version**: `package.json.version`
2. **MFA Version**: `package.json.mfaV8Version` 
3. **Unified Version**: `package.json.unifiedV8uVersion`
4. **Never** update one without the others

#### ✅ Commit Requirements
```bash
# Every commit with version changes must include:
git add package.json
git commit -m "version: Update to 9.13.1 - V9 ROPC flow migration"
```

#### ✅ Build Verification
```bash
# Verify server displays correct versions
npm start
# Check terminal output for version logs
```

## 🎨 Side Menu Version Integration

### Automatic Version Badge Application
```typescript
// src/config/sidebarMenuConfig.ts
export function getSidebarMenuGroupsWithVersionBadges(): SidebarMenuGroup[] {
  return applyVersionBadgesToGroups(SIDEBAR_MENU_GROUPS);
}
```

### Sidebar Rendering
```typescript
// src/components/SidebarMenuPing.tsx
<span className="sidebar-ping__item-label">{item.label}</span>
{renderVersionBadge(item)} // ← Automatic version badge
```

### Version Badge Display
- **V9 Migrated**: `V9 v9.13.1` (green badge)
- **Recently Migrated**: `MIGRATED v9.13.1` (amber badge)  
- **Legacy**: `LEGACY` (gray badge, no version)

## 📱 App.tsx Version Integration

### Version Display Components
```typescript
// src/components/AppVersionBadge.tsx
export const AppVersionBadge: React.FC<AppVersionBadgeProps> = ({ type }) => {
  const getVersion = () => {
    switch (type) {
      case 'app': return packageJson.version;
      case 'mfa': return packageJson.mfaV8Version;
      case 'unified': return packageJson.unifiedV8uVersion;
    }
  };
  // Renders: "APP v9.13.1", "MFA v9.13.1", etc.
};
```

### Automatic Version Updates
- **Package Changes**: App.tsx automatically reflects package.json updates
- **No Manual Updates**: Version displays are synchronized automatically
- **Real-time Updates**: Version badges update immediately after package changes

## 🔄 Migration Workflow Integration

### Pre-Migration Checklist
- [ ] **Current Version**: Note current package.json version
- [ ] **Backup**: Create backup of current version configuration
- [ ] **Dependencies**: Verify no version-specific dependencies

### During Migration
- [ ] **Code Migration**: Complete V9 messaging + Ping UI migration
- [ ] **Sidebar Update**: Add `migratedToV9: true` to menu item
- [ ] **Testing**: Verify application works with new version

### Post-Migration Process
- [ ] **Version Update**: Update package.json version numbers
- [ ] **Commit**: Commit version changes with migration notes
- [ ] **Verify**: Check version badges display correctly
- [ ] **Documentation**: Update migration records

## 📊 Version Tracking Examples

### Example 1: V7 ROPC Flow Migration
```typescript
// Before Migration
['/flows/mock-oidc-ropc', 'Mock OIDC ROPC'] // No migratedToV9 flag

// After Migration  
['/flows/mock-oidc-ropc', 'Mock OIDC ROPC', true] // Added migratedToV9

// Result: Green "V9 v9.13.1" badge appears in sidebar
```

### Example 2: Version Update
```json
// Before Update
{
  "version": "9.13.0",
  "mfaV8Version": "9.13.0", 
  "unifiedV8uVersion": "9.13.0"
}

// After Update
{
  "version": "9.13.1",
  "mfaV8Version": "9.13.1",
  "unifiedV8uVersion": "9.13.1"
}

// Result: All version badges automatically show "v9.13.1"
```

### Example 3: New Application
```typescript
// New V9 Application
['/flows/new-v9-app', 'New V9 App', true]

// Result: Green "V9 v9.13.1" badge appears immediately
```

## 🛠️ Implementation Guide

### For Developers

#### Adding New Applications
1. **Create Application**: Build with V9 + Ping UI standards
2. **Update Sidebar**: Add `migratedToV9: true` to menu item
3. **Version Badge**: Automatically appears as green V9 badge
4. **Testing**: Verify badge displays current version

#### Migrating Legacy Applications
1. **Complete Migration**: V9 messaging + Ping UI standardization
2. **Update Sidebar**: Add `migratedToV9: true` parameter
3. **Version Update**: Update package.json if needed
4. **Verify Badge**: Confirm green V9 badge appears

#### Version Updates
1. **Update Package.json**: Increment all version fields together
2. **Commit Changes**: Include version update in commit message
3. **Verify Display**: Check badges show new version
4. **Test Application**: Ensure all components work with new version

### For System Administrators

#### Monitoring Version Consistency
```bash
# Check package.json version synchronization
grep -E "(version|mfaV8Version|unifiedV8uVersion)" package.json

# Verify version badges in production
# Check sidebar for consistent version display
```

#### Version Rollback Process
1. **Identify Issue**: Determine version-related problem
2. **Rollback Package**: Revert package.json to previous version
3. **Verify Application**: Test with rolled-back version
4. **Document**: Record rollback reason and resolution

## 📈 Quality Assurance

### Version Badge Testing
- [ ] **V9 Applications**: Display green "V9 v{version}" badge
- [ ] **Legacy Applications**: Display gray "LEGACY" badge
- [ ] **Recently Migrated**: Display amber "MIGRATED v{version}" badge
- [ ] **Version Updates**: All badges update when package.json changes
- [ ] **Consistency**: Same version across all badge types

### Version Synchronization Testing
- [ ] **Package Updates**: All three version fields update together
- [ ] **App.tsx Display**: Version badges reflect current package versions
- [ ] **Sidebar Display**: Menu badges show correct versions
- [ ] **Server Logs**: Terminal displays synchronized versions

### Migration Verification
- [ ] **Pre-Migration**: Note current version and badge status
- [ ] **Post-Migration**: Confirm V9 badge appears
- [ ] **Version Update**: Verify badges update with new versions
- [ ] **Documentation**: Update migration records

## 🔧 Troubleshooting

### Common Issues

#### Version Badge Not Showing
**Problem**: Migrated application doesn't show V9 badge
**Solution**: 
1. Check `migratedToV9: true` in sidebarMenuConfig.ts
2. Verify VersionBadgeService is imported in SidebarMenuPing.tsx
3. Ensure `getSidebarMenuGroupsWithVersionBadges()` is called

#### Version Not Updating
**Problem**: Version badges show old version after package.json update
**Solution**:
1. Verify all three version fields updated in package.json
2. Restart development server
3. Clear browser cache
4. Check version.ts imports package.json correctly

#### TypeScript Errors
**Problem**: Version badge related TypeScript errors
**Solution**:
1. Check VersionBadgeService imports
2. Verify SidebarMenuItem interface includes versionBadge property
3. Ensure autoApplyVersionBadge function is properly typed

### Debugging Tools
```typescript
// Debug version badge configuration
console.log('Item version badge:', item.versionBadge);
console.log('Package version:', packageJson.version);

// Check version metadata
console.log('Version metadata:', VERSION_METADATA);
```

## 📚 Related Documentation

- [Gold Star Migration Indicator Guide](./gold-star-migration-indicator-guide.md)
- [V9 Modern Messaging Migration Guide](./v9-modern-messaging-migration-guide.md)
- [Ping UI Standardization Guide](./ping-ui-standardization-guide.md)
- [Dead File Archiving Guide](./dead-file-archiving-guide.md)
- [Logging Implementation Plan](./logging-implementation-plan.md)
- [Messaging System Standardization](./messaging-system-standardization.md)
- [Messaging Implementation Guide](./messaging-implementation-guide.md)

## 🎯 Best Practices

### Development Workflow
1. **Version First**: Update package.json before other changes
2. **Test Immediately**: Verify version badges after updates
3. **Document Changes**: Update migration records with version info
4. **Consistent Updates**: Always update all version fields together

### Code Quality
1. **Automatic Updates**: Use VersionBadgeService for automatic version handling
2. **Type Safety**: Ensure proper TypeScript types for version configurations
3. **Error Handling**: Graceful fallbacks for version display issues
4. **Performance**: Efficient version badge rendering

### User Experience
1. **Clear Indicators**: Use consistent color coding for version types
2. **Informative Tooltips**: Include version information in hover states
3. **Accessibility**: Proper ARIA labels for version badges
4. **Responsive Design**: Version badges work on all screen sizes

---

**Guide Created**: March 6, 2026  
**Version**: 1.0  
**Maintainer**: Standardization Team  

For questions about version management or to report issues, please contact the development team or create an issue in the project repository.
