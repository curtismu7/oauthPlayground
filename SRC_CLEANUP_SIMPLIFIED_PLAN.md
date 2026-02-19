# SRC Cleanup - Simplified App-Based Structure Plan
## Eliminate V8/V8U Distinctions, Organize by Distinct Applications

### **Backup Status**
✅ **Complete backup created**: Commit `eb117926` with tag `backup-before-src-cleanup`
✅ **Restore command**: `git checkout backup-before-src-cleanup`

---

## **Target Layout (App-Based)**

```
src/
  v7/                       # V7 flows (keep separate for V9 upgrade)
    pages/
    components/
    services/
    flows/
    
  apps/                     # All distinct apps with granular organization
    oauth/                   # OAuth flows app
      pages/                 # OAuth pages
      components/            # OAuth components
      services/              # OAuth services
      flows/                 # OAuth flows
      hooks/                 # OAuth-specific hooks
      contexts/              # OAuth contexts
      types/                 # OAuth types
      utils/                 # OAuth utilities
      config/                # OAuth configuration
      constants/             # OAuth constants
    mfa/                     # MFA flows app
      pages/                 # MFA pages
      components/            # MFA components
      services/              # MFA services
      flows/                 # MFA flows
      hooks/                 # MFA-specific hooks
      contexts/              # MFA contexts
      types/                 # MFA types
      utils/                 # MFA utilities
      config/                # MFA configuration
      constants/             # MFA constants
    protect/                 # Protect portal app
      pages/                 # Protect pages
      components/            # Protect components
      services/              # Protect services
      themes/                # Protect themes
      types/                 # Protect types
      contexts/              # Protect contexts
      hooks/                 # Protect-specific hooks
      utils/                 # Protect utilities
      config/                # Protect configuration
      assets/                # Protect assets (logos, images)
      layouts/               # Protect layouts
      styles/                # Protect styles
    user-management/         # User management app
      pages/                 # User management pages
      components/            # User management components
      services/              # User management services
      contexts/              # User management contexts
      hooks/                 # User management hooks
      types/                 # User management types
      utils/                 # User management utilities
    admin/                   # Admin utilities app
      pages/                 # Admin pages
      components/            # Admin components
      services/              # Admin services
      hooks/                 # Admin hooks
      types/                 # Admin types
      utils/                 # Admin utilities
      config/                # Admin configuration
    navigation/              # Side menu/navigation app
      components/            # Navigation components
      hooks/                 # Navigation hooks
      services/              # Navigation services
      types/                 # Navigation types
      utils/                 # Navigation utilities
      contexts/              # Navigation contexts
      styles/                # Navigation styles
    
  shared/                   # Truly shared code across all apps
    components/              # Reusable UI components
    services/                # Shared service clients/adapters
    hooks/                   # Shared hooks
    utils/                   # Shared utilities
    types/                   # Shared types
    contexts/                # Shared contexts
    styles/                  # Shared styles
    constants/               # Shared constants
    config/                  # Shared configuration
    
  server/                   # Backend API
  config/                   # Global configuration
  tests/                    # Tests
```

### **Key Changes from Current Plan**
❌ **Remove**: `src/apps/v8/` and `src/apps/v8u/` separation  
✅ **Keep**: `src/v7/` separate (for V9 upgrade later)
✅ **Create**: `src/apps/` structure for distinct applications
✅ **Organize**: 6 distinct apps (OAuth, MFA, Protect, User Management, Admin, Navigation)
✅ **Granular**: Each app has detailed subfolders (pages, components, services, flows, hooks, contexts, types, utils, config, constants)
✅ **Consolidate**: Shared code under `src/shared/`

---

## **Migration Strategy (Simplified)**

### **Phase 0: Safety Net** ✅ (Already Complete)
- Backup created
- Feature gates working
- Baseline tests pass

### **Phase 1: Create Granular App-Based Structure** (Day 1)
```bash
# Create V7 separate (for V9 upgrade later)
mkdir -p src/v7/{pages,components,services,flows}

# Create apps structure with granular subfolders for distinct applications
mkdir -p src/apps/{oauth,mfa,protect,user-management,admin,navigation}

# OAuth app granular structure
mkdir -p src/apps/oauth/{pages,components,services,flows,hooks,contexts,types,utils,config,constants}

# MFA app granular structure
mkdir -p src/apps/mfa/{pages,components,services,flows,hooks,contexts,types,utils,config,constants}

# Protect app granular structure (already exists, verify structure)
mkdir -p src/apps/protect/{pages,components,services,themes,types,contexts,hooks,utils,config,assets,layouts,styles}

# User Management app granular structure
mkdir -p src/apps/user-management/{pages,components,services,contexts,hooks,types,utils}

# Admin app granular structure
mkdir -p src/apps/admin/{pages,components,services,hooks,types,utils,config}

# Navigation app granular structure
mkdir -p src/apps/navigation/{components,hooks,services,types,utils,contexts,styles}

# Create shared code structure
mkdir -p src/shared/{components,services,hooks,utils,types,contexts,styles,constants,config}
mkdir -p src/{server,config,tests}

# Move V7 to its dedicated location
git mv src/v7m/* src/v7/
git mv src/v7/* src/v7/  # if any other V7 content

# Move existing apps to new structure
git mv src/pages/protect-portal/* src/apps/protect/
git mv src/protect-app/* src/apps/protect/
git mv src/v8u/apps/UserManagementApp.tsx src/apps/user-management/
git mv src/v8u/pages/UserManagementPage.tsx src/apps/user-management/pages/
git mv src/v8u/components/UserInfoSuccessModalV8U.tsx src/apps/user-management/components/
git mv src/v8u/components/UserTokenStatusDisplayV8U.tsx src/apps/user-management/components/
git mv src/v8u/contexts/UserManagementContext.tsx src/apps/user-management/contexts/

# Move navigation components
git mv src/components/Sidebar.tsx src/apps/navigation/components/
git mv src/components/Navbar.tsx src/apps/navigation/components/
git mv src/components/DragDropSidebar.tsx src/apps/navigation/components/
git mv src/components/SidebarSearch.tsx src/apps/navigation/components/
git mv src/components/VersionBadge.tsx src/apps/navigation/components/
```

### **Phase 2: Consolidate by App** (Day 2-3)

#### **OAuth App Consolidation**
```bash
# OAuth pages (from v8u)
git mv src/v8u/pages/* src/apps/oauth/pages/

# OAuth components
git mv src/v8u/components/* src/apps/oauth/components/

# OAuth services
git mv src/v8u/services/* src/apps/oauth/services/

# OAuth flows
git mv src/v8u/flows/* src/apps/oauth/flows/

# OAuth hooks
git mv src/v8u/hooks/* src/apps/oauth/hooks/

# OAuth contexts
git mv src/v8u/contexts/* src/apps/oauth/contexts/

# OAuth types, utils, config, constants
git mv src/v8u/types/* src/apps/oauth/types/
git mv src/v8u/utils/* src/apps/oauth/utils/
git mv src/v8u/config/* src/apps/oauth/config/
# (constants would need to be created or moved from shared)
```

#### **MFA App Consolidation**
```bash
# MFA pages (from v8)
git mv src/v8/pages/* src/apps/mfa/pages/

# MFA components
git mv src/v8/components/* src/apps/mfa/components/

# MFA services
git mv src/v8/services/* src/apps/mfa/services/

# MFA flows
git mv src/v8/flows/* src/apps/mfa/flows/

# MFA hooks
git mv src/v8/hooks/* src/apps/mfa/hooks/

# MFA contexts
git mv src/v8/contexts/* src/apps/mfa/contexts/

# MFA types, utils, config, constants
git mv src/v8/types/* src/apps/mfa/types/
git mv src/v8/utils/* src/apps/mfa/utils/
git mv src/v8/config/* src/apps/mfa/config/
git mv src/v8/constants/* src/apps/mfa/constants/
```

#### **Admin App Consolidation**
```bash
# Admin utilities (from various locations)
git mv src/v8/pages/DeleteAllDevicesUtilityV8.tsx src/apps/admin/pages/
git mv src/v8/pages/MFAFeatureFlagsAdminV8.tsx src/apps/admin/pages/
git mv src/v8/pages/MFADeviceManagementFlowV8.tsx src/apps/admin/pages/
git mv src/v8/pages/MFAReportingFlowV8.tsx src/apps/admin/pages/

# Admin components, services, hooks, types, utils
# (These would be identified and moved from v8 as needed)
```

### **Phase 3: Update Imports** (Day 4)
```bash
# Update all imports to new app-based paths
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*v8/|from ../apps/mfa/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*v8u/|from ../apps/oauth/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*protect-portal/|from ../apps/protect/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*protect-app/|from ../apps/protect/|g'

# Update App.tsx imports
# OAuth imports: from ./v8u/... → ./apps/oauth/...
# MFA imports: from ./v8/... → ./apps/mfa/...
# Protect imports: from ./pages/protect-portal/... → ./apps/protect/...
# User Management imports: from ./v8u/... → ./apps/user-management/...
# Navigation imports: from ./components/Sidebar... → ./apps/navigation/components/...

# Test after updates
npm run build
npm test
./scripts/check-*.sh
```

### **Phase 4: Remove Old Structure** (Day 5)
```bash
# Remove old versioned folders (keep V7)
rmdir src/v8 src/v8u src/v7m src/protect-app

# Remove old unified folders that were created in Phase 1
rmdir src/pages src/components src/services

# Clean up any remaining old structure
```

---

## **Import Boundary Rules (App-Based)**

### **Allowed**
- `src/apps/**` → may import from `src/shared/**`
- `src/apps/oauth/**` → may import from `src/apps/oauth/**`
- `src/apps/mfa/**` → may import from `src/apps/mfa/**`
- `src/apps/protect/**` → may import from `src/apps/protect/**`
- `src/apps/user-management/**` → may import from `src/apps/user-management/**`
- `src/apps/admin/**` → may import from `src/apps/admin/**`
- `src/apps/navigation/**` → may import from `src/apps/navigation/**`

### **Disallowed**
- `src/shared/**` **must not** import from `src/apps/**`
- `src/apps/oauth/**` must not import from `src/apps/mfa/**` (and vice versa), unless explicitly approved
- `src/apps/protect/**` must not import from other apps (unless explicitly approved)
- Cross-app imports should go through `src/shared/**`

---

## **Benefits of App-Based Structure**

### **Simplicity**
- No V8/V8U version confusion
- Clear application boundaries
- V7 kept separate for future V9 upgrade
- Easier to find related code

### **Maintainability**
- Single source of truth for each app
- V7 isolated for upgrade path
- Clear ownership by application area
- No duplicate code across versions

### **Development**
- Easier onboarding (clear app boundaries)
- Clear import paths
- Reduced cognitive load
- V7 upgrade can happen independently

---

## **Testing Strategy**

### **Automated (Every Phase)**
```bash
npm ci
npm run build
npm test
./comprehensive-inventory-check.sh
./scripts/check-mfa-features.sh
./scripts/check-oauth-features.sh
./scripts/check-protect-features.sh
npm run lint
```

### **Manual (After Consolidation)**
- **OAuth flows**: Test all OAuth grant types work
- **MFA flows**: Test device registration, authentication
- **Protect portal**: Test authentication and functionality
- **Navigation**: Test sidebar, navbar, menu functionality
- **User Management**: Test user management features
- **Navigation between all apps**: Test all routes work correctly

---

## **Risk Mitigation**

### **Lower Risk Than Original Plan**
- Fewer folder moves (no app separation)
- Simpler import updates
- Less complex restructuring

### **Rollback Strategy**
```bash
# Complete rollback
git checkout backup-before-src-cleanup

# Partial rollback (if specific phase fails)
git log --oneline --since="backup-before-src-cleanup"
git checkout <commit-before-problematic-phase>
```

---

## **Success Criteria**

### **Technical**
✅ All builds pass
✅ All tests pass
✅ All routes work correctly
✅ No import errors

### **Functional**
✅ OAuth flows work (auth code, implicit, ROPC, device, PAR)
✅ MFA flows work (SMS, Email, TOTP, FIDO2, Mobile)
✅ Protect portal works
✅ Navigation/sidebar works
✅ User management works
✅ Navigation between all pages works

### **Maintainability**
✅ Clear application organization
✅ No version confusion
✅ Easy to locate code by application
✅ Simplified import paths

---

## **Timeline**
- **Day 1**: Phase 1 (Create app-based structure)
- **Day 2-3**: Phase 2 (Consolidate by application)
- **Day 4**: Phase 3 (Update imports)
- **Day 5**: Phase 4 (Remove old structure)

**Total**: 5 days (simpler than original 6-day plan)

---

## **Ready to Start**

This app-based plan:
- ✅ Eliminates V8/V8U distinctions
- ✅ Organizes by 6 distinct applications
- ✅ Includes navigation as its own app
- ✅ Reduces complexity
- ✅ Maintains all functionality
- ✅ Provides clear rollback strategy

**Approve to begin Phase 1: Create app-based structure**
