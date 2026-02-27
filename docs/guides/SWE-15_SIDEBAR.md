# SWE-15: Sidebar Menu System

## 🎯 Purpose
This document provides the SWE-15 (Software Engineering - Week 15) guidelines for working with the sidebar menu system in the OAuth Playground application.

## 📋 System Overview (Updated Feb 2026)

### Architecture (Rebuilt)
The sidebar system has been completely rebuilt with a clean, maintainable architecture:

**Core Components:**
- **`Sidebar.tsx`** (~260 lines): Container component handling layout, resize, search, drag-drop toggle
- **`DragDropSidebar.tsx`**: All menu structure, items, groups, and drag-drop logic
- **`SidebarSearch.tsx`**: Search input with advanced filtering options
- **`VersionBadge.tsx`**: Version display with sidebar-specific styling

**Component Responsibilities:**
- **Sidebar.tsx**: Container, layout, resize handle, search state, drag mode toggle
- **DragDropSidebar.tsx**: Menu items, groups, navigation, drag-drop functionality
- **CRITICAL**: Menu structure is NOT in Sidebar.tsx - it belongs in DragDropSidebar.tsx

### Key Features
- **Resizable Sidebar**: Drag handle with localStorage persistence (300-600px range)
- **Search Functionality**: Real-time filtering with "match anywhere" option
- **Drag & Drop Mode**: Toggle between standard and drag-drop menu organization
- **Version Display**: App version and component-specific versions
- **Clean State Management**: All menu structure handled by DragDropSidebar
- **Responsive Design**: Proper styling with hover states and focus indicators

### State Management
- **Sidebar width**: `localStorage.getItem('sidebar.width')` (default: 300px)
- **Drag mode**: `localStorage.getItem('sidebar.dragDropMode')` (default: false)
- **Search query**: Component state (not persisted)
- **Resize state**: useRef for performance optimization

## 🔍 Issue Hotspots (Known Problems)

### 🎉 RESOLVED: Orphaned Code and Syntax Errors (Feb 2026)
**Location**: `src/components/Sidebar.tsx` - Complete file rebuild
**Problem**: 1,300+ lines of orphaned code causing syntax errors and lint warnings
**Solution**: Complete architectural rebuild with clean separation of concerns
**Impact**: File reduced from 1,800+ lines to ~260 lines, all syntax errors resolved
**Status**: ✅ RESOLVED

### 1. Menu Update Cache Issues
**Location**: `src/components/Sidebar.tsx` - Component state management
**Problem**: Sidebar changes (moving items, updating icons) require browser cache clearing
**Root Cause**: React component state caching + localStorage persistence
**Impact**: Changes don't appear until browser cache is cleared

### 2. Badge Icon Inconsistency  
**Location**: `src/components/Sidebar.tsx` - MigrationBadge components
**Problem**: Generic green check boxes instead of descriptive badges
**Root Cause**: Using `<FiCheckCircle />` instead of descriptive text
**Impact**: Users can't quickly identify app functionality

### 3. State Persistence Issues
**Location**: `src/components/Sidebar.tsx` - localStorage integration
**Problem**: Menu open/closed state persists across code changes
**Root Cause**: localStorage not cleared when menu structure changes
**Impact**: Old state conflicts with new menu structure

### 4. Icon Color Standards
**Location**: `src/components/Sidebar.tsx` - ColoredIcon components
**Problem**: Inconsistent icon colors across menu groups
**Root Cause**: No centralized color standard enforcement
**Impact**: Visual inconsistency in navigation

## 🛑 STOP-SHIP Rules (NON-NEGOTIABLE)

### You MUST NOT:
- ❌ Deploy sidebar changes without testing cache clearing workflow
- ❌ Add menu structure to Sidebar.tsx (it belongs in DragDropSidebar.tsx)
- ❌ Use generic icons instead of descriptive badges
- ❌ Change menu structure without updating localStorage handling
- ❌ Introduce new icon colors without updating standards
- ❌ Break existing menu functionality during updates
- ❌ Add orphaned code or unused imports to Sidebar.tsx
- ❌ Modify DragDropSidebar without understanding impact on menu structure

### You MUST:
- ✅ Keep Sidebar.tsx focused on container/layout concerns only
- ✅ Put all menu items and structure in DragDropSidebar.tsx
- ✅ Test sidebar changes with cache clearing workflow
- ✅ Use descriptive badges that match app functionality
- ✅ Follow icon color standards for menu groups
- ✅ Update documentation when menu structure changes
- ✅ Verify all menu items work after changes
- ✅ Remove unused imports and styled components
- ✅ Maintain clean separation of concerns

## 🔧 Prevention Commands

### Cache Clearing Workflow
```bash
# 1. Make sidebar changes
# 2. Run biome formatting
npx @biomejs/biome check src/components/Sidebar.tsx --write

# 3. Clear browser storage (in DevTools console)
localStorage.clear()

# 4. Hard refresh browser
# Chrome: Cmd+Shift+R
# Firefox: Ctrl+F5
```

### Badge Consistency Check
```bash
# Check for generic check circles
rg -n "FiCheckCircle" src/components/Sidebar.tsx

# Verify badge descriptions match app functionality
rg -n "MigrationBadge.*title" src/components/Sidebar.tsx
```

### Icon Color Standards Check
```bash
# Check Production items (should be #10b981)
rg -n "\$color=\"#10b981\"" src/components/Sidebar.tsx

# Check Development items (should be #3b82f6)  
rg -n "\$color=\"#3b82f6\"" src/components/Sidebar.tsx

# Check Protect items (should be #dc2626)
rg -n "\$color=\"#dc2626\"" src/components/Sidebar.tsx
```

### Menu Structure Validation
```bash
# Check for duplicate menu IDs
rg -n "id:" src/components/Sidebar.tsx | sort | uniq -d

# Verify all menu items have required properties
rg -n "id:|path:|label:|icon:" src/components/Sidebar.tsx
```

## 🎨 Icon Color Standards

### Production Items
- **Color**: `#10b981` (green)
- **Usage**: Production-ready flows and applications
- **Examples**: DPoP Authorization Code, Token Exchange, MFA flows

### Development Items  
- **Color**: `#3b82f6` (blue)
- **Usage**: Development tools and utilities
- **Examples**: Flow Comparison Tool, Debug Log Viewer

### Legacy Items
- **Color**: `#10b981` (green)
- **Usage**: Legacy production flows (marked as Legacy)
- **Examples**: V7 OAuth flows, older implementations

### Protect Items
- **Color**: `#dc2626` (red)
- **Usage**: PingOne Protect related features
- **Examples**: Risk evaluation, fraud detection, Protect Portal

## 📝 Badge Standards

### Badge Categories
- **"AUTH"** - Authorization Code flows
- **"OAUTH"** - OAuth 2.0 flows  
- **"TOKEN"** - Token Exchange flows
- **"DPOP"** - DPoP (RFC 9449) flows
- **"DEVICE"** - Device Authorization flows
- **"CLIENT"** - Client Credentials flows
- **"ROPC"** - Resource Owner Password flows
- **"PROTECT"** - PingOne Protect features
- **"UNIFIED"** - Unified flow implementations
- **"UTILITY"** - Utility tools
- **"EDUCATION"** - Educational flows

### Badge Implementation
```typescript
<MigrationBadge title="Descriptive tooltip text">
  BADGE_TEXT
</MigrationBadge>
```

## 🔄 Update Workflow

### When Making Sidebar Changes:
1. **Plan Changes**: Identify what needs to be updated
2. **Update Code**: Make changes to `src/components/Sidebar.tsx`
3. **Run Biome**: Format and lint the code
4. **Clear Cache**: Clear browser localStorage
5. **Hard Refresh**: Refresh browser with cache bypass
6. **Verify Changes**: Check all menu items work correctly
7. **Update Docs**: Update this guide if needed

### Testing Checklist:
- [ ] Menu items appear in correct groups
- [ ] Icon colors match standards
- [ ] Badge text describes app functionality
- [ ] Menu state persists correctly
- [ ] All navigation links work
- [ ] No console errors
- [ ] Responsive design works

## 🚨 Emergency Procedures

### If Menu Breaks:
1. **Immediate**: Stop and assess impact
2. **Rollback**: Revert to last working state
3. **Clear Cache**: Clear localStorage and hard refresh
4. **Investigate**: Check for state conflicts
5. **Document**: Update this guide with lessons learned

### Cache Issues:
1. **Clear Storage**: `localStorage.clear()` in DevTools
2. **Hard Refresh**: `Cmd+Shift+R` (Chrome) or `Ctrl+F5` (Firefox)
3. **Incognito Test**: Open in incognito window
4. **Multiple Browsers**: Test in Chrome, Firefox, Safari

## 📚 Related Documentation

### Primary Documents
- **SWE-15_SIDEBAR.md**: This engineering guidelines document
- **SIDEBARMENU_INVENTORY.md**: Complete inventory and issue tracking
- **update/master-prompts.md**: Development workflow and processes

### Component Documentation
- **Sidebar.tsx**: Container component documentation
- **DragDropSidebar.tsx**: Menu structure and navigation
- **SidebarSearch.tsx**: Search functionality
- **VersionBadge.tsx**: Version display component

### Historical Documents
- **SIDEBAR_MENU_UPDATE_ISSUES.md**: Legacy issues and solutions
- **SIDEMENU_INVENTORY.md**: Previous inventory (migrated to SIDEBARMENU_INVENTORY.md)
- **PRODUCTION_INVENTORY.md**: Production inventory

## 🔄 Version History

### v2.0 - Complete Architecture Rebuild (Feb 16, 2026)
- **MAJOR**: Complete rebuild of sidebar architecture
- Removed 1,300+ lines of orphaned code
- Separated concerns: Sidebar.tsx (container) vs DragDropSidebar.tsx (menu)
- File size reduced from 1,800+ to ~260 lines
- Resolved all syntax errors and lint warnings
- Added clean state management with localStorage
- Implemented resizable sidebar with drag handle
- Added search functionality with advanced filtering
- Integrated drag & drop mode toggle
- Updated all documentation to reflect new architecture
- Migrated SIDEMENU_INVENTORY.md to SIDEBARMENU_INVENTORY.md

### v1.0 - Initial Documentation
- Documented sidebar menu system
- Identified cache clearing workflow
- Established icon color standards
- Created badge guidelines

### v1.1 - Badge Standardization
- Replaced generic check circles with descriptive badges
- Updated badge categories and standards
- Fixed icon color inconsistencies

---

**Last Updated**: February 16, 2026  
**Next Review**: When sidebar structure changes  
**Maintainer**: Development Team
