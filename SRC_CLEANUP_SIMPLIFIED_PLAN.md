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
      services/              # OAuth-specific services only
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
      services/              # MFA-specific services only
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
      services/              # Protect-specific services only
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
      services/              # User management-specific services only
      contexts/              # User management contexts
      hooks/                 # User management hooks
      types/                 # User management types
      utils/                 # User management utilities
    admin/                   # Admin utilities app
      pages/                 # Admin pages
      components/            # Admin components
      services/              # Admin-specific services only
      hooks/                 # Admin hooks
      types/                 # Admin types
      utils/                 # Admin utilities
      config/                # Admin configuration
    navigation/              # Side menu/navigation app
      components/            # Navigation components
      hooks/                 # Navigation hooks
      services/              # Navigation-specific services only
      types/                 # Navigation types
      utils/                 # Navigation utilities
      contexts/              # Navigation contexts
      styles/                # Navigation styles
    
  shared/                   # Truly shared code across all apps
    components/              # Reusable UI components
    services/                # Shared services (auth, storage, API clients, etc.)
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

### **Service Organization Strategy**

#### **Shared Services** (in `src/shared/services/`)
- **Authentication services** - Used by multiple apps
- **Storage services** - Local storage, session management
- **API client services** - HTTP clients, API utilities
- **Environment services** - Environment configuration
- **Token services** - Token management, validation
- **Error handling services** - Global error handling
- **Logging services** - Application logging
- **Configuration services** - Global app configuration

#### **App-Specific Services** (in each `src/apps/{app}/services/`)
- **OAuth App**: OAuth flow services, PAR services, device auth services
- **MFA App**: MFA device services, MFA configuration services
- **Protect App**: Protect-specific business logic, risk evaluation
- **User Management App**: User management business logic
- **Admin App**: Admin utilities, reporting services
- **Navigation App**: Navigation state management

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

# COMPREHENSIVE TESTING AFTER PHASE 1
echo "🧪 Running comprehensive tests after Phase 1..."
./scripts/comprehensive-test.sh "Phase 1"
if [ $? -eq 0 ]; then
    echo "✅ Phase 1 comprehensive testing passed"
    
    # Additional smoke testing
    echo "🔥 Running smoke tests..."
    ./scripts/smoke-test.sh "Phase 1"
    if [ $? -eq 0 ]; then
        echo "✅ Phase 1 smoke testing passed"
        
        # Create regression baseline
        echo "📸 Creating regression baseline..."
        ./scripts/regression-test.sh "baseline" "Phase 1"
        
        echo "✅ Phase 1 testing complete - safe to proceed"
        git commit -m "Phase 1: Create granular app-based structure - 6 apps with detailed subfolders"
    else
        echo "❌ Phase 1 smoke testing failed - fix issues before proceeding"
        exit 1
    fi
else
    echo "❌ Phase 1 comprehensive testing failed - fix issues before proceeding"
    exit 1
fi
```

### **Phase 2: Consolidate by App with Testing** (Day 2-3)

#### **Step 1: Identify and Categorize Services**
```bash
# First, analyze all services to determine shared vs app-specific
# Create a service categorization document
echo "Analyzing services for shared vs app-specific categorization..."

# Services that should go to shared/ (used by multiple apps)
SHARED_SERVICES=(
  "globalEnvironmentService"
  "storageServiceV8"
  "errorHandlerV8"
  "validationServiceV8"
  "tokenOperationsServiceV8"
  "workerTokenServiceV8"
  "pingOneAuthenticationServiceV8"
  "environmentServiceV8"
  "apiDisplayServiceV8"
  # Add more as identified
)

# Services that should stay app-specific
OAUTH_SPECIFIC=(
  "oauthIntegrationServiceV8"
  "authorizationUrlBuilderServiceV8U"
  "parRarIntegrationServiceV8U"
  "deviceAuthorizationSecurityService"
  "pkceStorageServiceV8U"
)

MFA_SPECIFIC=(
  "mfaServiceV8"
  "mfaConfigurationServiceV8"
  "mfaAuthenticationServiceV8"
  "mfaReportingServiceV8"
  "fido2SessionCookieServiceV8"
  "webAuthnAuthenticationServiceV8"
)
```

#### **Step 2: Move Shared Services First**
```bash
# Move shared services to src/shared/services/
for service in "${SHARED_SERVICES[@]}"; do
  if [ -f "src/v8/services/$service.ts" ]; then
    git mv "src/v8/services/$service.ts" "src/shared/services/"
    echo "✅ Moved shared service: $service"
  fi
done

# COMPREHENSIVE TESTING AFTER SHARED SERVICES MOVE
echo "🧪 Running comprehensive tests after shared services move..."
./scripts/comprehensive-test.sh "Phase 2 - Shared Services"
if [ $? -eq 0 ]; then
    echo "✅ Shared services comprehensive testing passed"
    
    # Integration testing
    echo "🔗 Running integration tests..."
    ./scripts/integration-test.sh "Phase 2 - Shared Services"
    if [ $? -eq 0 ]; then
        echo "✅ Shared services integration testing passed"
        
        # Regression testing
        echo "🔍 Running regression tests..."
        ./scripts/regression-test.sh "compare" "Phase 1"
        if [ $? -eq 0 ]; then
            echo "✅ Shared services regression testing passed"
            echo "✅ Shared services move successful"
            git commit -m "Phase 2a: Move shared services to src/shared/services/"
        else
            echo "❌ Shared services regression testing failed"
            git reset --hard HEAD~1
            exit 1
        fi
    else
        echo "❌ Shared services integration testing failed"
        git reset --hard HEAD~1
        exit 1
    fi
else
    echo "❌ Shared services comprehensive testing failed - rollback needed"
    git reset --hard HEAD~1
    exit 1
fi
```

#### **Step 3: OAuth App Consolidation**
```bash
echo "🚀 Starting OAuth App consolidation..."

# OAuth pages (from v8u)
git mv src/v8u/pages/* src/apps/oauth/pages/

# OAuth components
git mv src/v8u/components/* src/apps/oauth/components/

# OAuth flows
git mv src/v8u/flows/* src/apps/oauth/flows/

# OAuth hooks
git mv src/v8u/hooks/* src/apps/oauth/hooks/

# OAuth contexts
git mv src/v8u/contexts/* src/apps/oauth/contexts/

# OAuth types, utils, config
git mv src/v8u/types/* src/apps/oauth/types/
git mv src/v8u/utils/* src/apps/oauth/utils/
git mv src/v8u/config/* src/apps/oauth/config/

# OAuth-specific services only
for service in "${OAUTH_SPECIFIC[@]}"; do
  if [ -f "src/v8u/services/$service.ts" ]; then
    git mv "src/v8u/services/$service.ts" "src/apps/oauth/services/"
    echo "✅ Moved OAuth-specific service: $service"
  fi
  if [ -f "src/v8/services/$service.ts" ]; then
    git mv "src/v8/services/$service.ts" "src/apps/oauth/services/"
    echo "✅ Moved OAuth-specific service: $service"
  fi
done

# COMPREHENSIVE TESTING AFTER OAUTH APP CONSOLIDATION
echo "🧪 Running comprehensive tests after OAuth app consolidation..."
./scripts/comprehensive-test.sh "Phase 2 - OAuth App"
if [ $? -eq 0 ]; then
    echo "✅ OAuth app consolidation successful"
    git commit -m "Phase 2b: Consolidate OAuth app content with granular structure"
else
    echo "❌ OAuth app consolidation failed - rollback needed"
    git reset --hard HEAD~1
    exit 1
fi
```

#### **Step 4: MFA App Consolidation**
```bash
echo "🚀 Starting MFA App consolidation..."

# MFA pages (from v8)
git mv src/v8/pages/* src/apps/mfa/pages/

# MFA components
git mv src/v8/components/* src/apps/mfa/components/

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

# MFA-specific services only
for service in "${MFA_SPECIFIC[@]}"; do
  if [ -f "src/v8/services/$service.ts" ]; then
    git mv "src/v8/services/$service.ts" "src/apps/mfa/services/"
    echo "✅ Moved MFA-specific service: $service"
  fi
done

# COMPREHENSIVE TESTING AFTER MFA APP CONSOLIDATION
echo "🧪 Running comprehensive tests after MFA app consolidation..."
./scripts/comprehensive-test.sh "Phase 2 - MFA App"
if [ $? -eq 0 ]; then
    echo "✅ MFA app consolidation successful"
    git commit -m "Phase 2c: Consolidate MFA app content with granular structure"
else
    echo "❌ MFA app consolidation failed - rollback needed"
    git reset --hard HEAD~1
    exit 1
fi
```

#### **Step 5: Admin App Consolidation**
```bash
echo "🚀 Starting Admin App consolidation..."

# Admin utilities (from v8)
git mv src/v8/pages/DeleteAllDevicesUtilityV8.tsx src/apps/admin/pages/
git mv src/v8/pages/MFAFeatureFlagsAdminV8.tsx src/apps/admin/pages/
git mv src/v8/pages/MFADeviceManagementFlowV8.tsx src/apps/admin/pages/
git mv src/v8/pages/MFAReportingFlowV8.tsx src/apps/admin/pages/

# Identify and move admin-specific services
ADMIN_SERVICES=(
  "mfaReportingServiceV8"
  "mfaFeatureFlagsV8"
  "sqliteStatsServiceV8"
  # Add more as identified
)

for service in "${ADMIN_SERVICES[@]}"; do
  if [ -f "src/v8/services/$service.ts" ]; then
    git mv "src/v8/services/$service.ts" "src/apps/admin/services/"
    echo "✅ Moved Admin-specific service: $service"
  fi
done

# COMPREHENSIVE TESTING AFTER ADMIN APP CONSOLIDATION
echo "🧪 Running comprehensive tests after Admin app consolidation..."
./scripts/comprehensive-test.sh "Phase 2 - Admin App"
if [ $? -eq 0 ]; then
    echo "✅ Admin app consolidation successful"
    git commit -m "Phase 2d: Consolidate Admin app content with granular structure"
else
    echo "❌ Admin app consolidation failed - rollback needed"
    git reset --hard HEAD~1
    exit 1
fi
```

### **Phase 3: Update Imports** (Day 4)
```bash
# Update all imports to new app-based paths
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*v8/|from ../apps/mfa/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*v8u/|from ../apps/oauth/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*protect-portal/|from ../apps/protect/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*protect-app/|from ../apps/protect/|g'

# Update shared imports
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*shared/|from ../shared/|g'

# COMPREHENSIVE TESTING AFTER IMPORT UPDATES
echo "🧪 Running comprehensive tests after import updates..."
./scripts/comprehensive-test.sh "Phase 3 - Import Updates"
if [ $? -eq 0 ]; then
    echo "✅ Import updates successful"
    git commit -m "Phase 3: Update all imports to new app-based paths"
else
    echo "❌ Import updates failed - rollback needed"
    git reset --hard HEAD~1
    exit 1
fi
```

### **Phase 4: Remove Old Structure** (Day 5)
```bash
# Remove old versioned folders (keep V7)
rmdir src/v8 src/v8u src/v7m src/protect-app

# Remove old unified folders that were created in Phase 1
rmdir src/pages src/components src/services

# Clean up any remaining old structure
find src -name "*.backup" -delete
find src -name "*.bak" -delete

# COMPREHENSIVE TESTING AFTER OLD STRUCTURE REMOVAL
echo "🧪 Running comprehensive tests after old structure removal..."
./scripts/comprehensive-test.sh "Phase 4 - Old Structure Removal"
if [ $? -eq 0 ]; then
    echo "✅ Old structure removal successful"
    git commit -m "Phase 4: Remove old V8/V8U folder structure"
else
    echo "❌ Old structure removal failed - rollback needed"
    git reset --hard HEAD~1
    exit 1
fi
```

### **Phase 5: Final Cleanup and Testing** (Day 6)
```bash
# Final cleanup
find src -name "*.DS_Store" -delete
find src -name "Thumbs.db" -delete

# Update any remaining documentation
echo "📝 Updating documentation..."
# Update README.md, etc.

# FINAL COMPREHENSIVE TESTING
echo "🧪 Running FINAL comprehensive tests..."
./scripts/comprehensive-test.sh "Phase 5 - Final"
if [ $? -eq 0 ]; then
    echo "✅ Final testing successful"
    echo "🎉 SRC CLEANUP COMPLETE!"
    git commit -m "Phase 5: Final cleanup and testing - SRC cleanup complete"
else
    echo "❌ Final testing failed - fix issues before completion"
    exit 1
fi

# Create completion report
echo "📊 Creating completion report..."
echo "# SRC Cleanup Completion Report" > cleanup-completion-report.md
echo "Completed on: $(date)" >> cleanup-completion-report.md
echo "" >> cleanup-completion-report.md
echo "## Structure Created" >> cleanup-completion-report.md
echo "- ✅ 6 distinct apps with granular subfolders" >> cleanup-completion-report.md
echo "- ✅ V7 kept separate for V9 upgrade" >> cleanup-completion-report.md
echo "- ✅ Shared code properly organized" >> cleanup-completion-report.md
echo "- ✅ All imports updated" >> cleanup-completion-report.md
echo "- ✅ Old structure removed" >> cleanup-completion-report.md
echo "" >> cleanup-completion-report.md
echo "## Testing Results" >> cleanup-completion-report.md
echo "- ✅ Build passes" >> cleanup-completion-report.md
echo "- ✅ All feature checks pass" >> cleanup-completion-report.md
echo "- ✅ Lint passes" >> cleanup-completion-report.md
echo "- ✅ Type check passes" >> cleanup-completion-report.md
echo "- ✅ Unit tests pass" >> cleanup-completion-report.md
```

---

## **Comprehensive Testing Strategy**

### **Testing Layers**

#### **1. Comprehensive Testing** (`scripts/comprehensive-test.sh`)
- **Build Testing**: Ensure project builds successfully
- **Critical Files**: Verify essential files exist
- **App Structure**: Check directory structure integrity
- **Import Analysis**: Detect broken imports
- **Feature Checks**: Run all app feature checks
- **Lint Testing**: Code quality checks
- **Type Checking**: TypeScript validation
- **Unit Tests**: Test suite execution

#### **2. Smoke Testing** (`scripts/smoke-test.sh`)
- **App Startup**: Verify application starts
- **Basic Endpoints**: Test critical pages load
- **Critical Flows**: Test OAuth, MFA, Protect flows
- **Navigation**: Verify navigation works
- **API Endpoints**: Test API responsiveness
- **User Interface**: Basic UI functionality

#### **3. Integration Testing** (`scripts/integration-test.sh`)
- **App Communication**: Test app-to-app interactions
- **Shared Components**: Verify shared component usage
- **Shared Services**: Test service integration
- **Data Flow**: Verify cross-app data sharing
- **Routing Integration**: Test routing configuration
- **Theme Integration**: Verify styling consistency

#### **4. Regression Testing** (`scripts/regression-test.sh`)
- **Baseline Creation**: Snapshot current state
- **Structure Comparison**: Detect structural changes
- **Import Comparison**: Track import changes
- **Route Comparison**: Verify route integrity
- **Component Comparison**: Track component changes
- **Service Comparison**: Verify service consistency
- **Performance Testing**: Build time and bundle size
- **Critical Functionality**: Ensure no features lost

### **Testing After Each Phase**

#### **Phase 1 Testing**
```bash
./scripts/comprehensive-test.sh "Phase 1"
./scripts/smoke-test.sh "Phase 1"
./scripts/regression-test.sh "baseline" "Phase 1"
```

#### **Phase 2 Testing** (After Each Step)
```bash
./scripts/comprehensive-test.sh "Phase 2 - [Step]"
./scripts/integration-test.sh "Phase 2 - [Step]"
./scripts/regression-test.sh "compare" "Phase 1"
./scripts/smoke-test.sh "Phase 2 - [Step]"
```

#### **Phase 3 Testing**
```bash
./scripts/comprehensive-test.sh "Phase 3 - Import Updates"
./scripts/integration-test.sh "Phase 3 - Import Updates"
./scripts/regression-test.sh "compare" "Phase 2"
./scripts/smoke-test.sh "Phase 3 - Import Updates"
```

#### **Phase 4 Testing**
```bash
./scripts/comprehensive-test.sh "Phase 4 - Old Structure Removal"
./scripts/regression-test.sh "compare" "Phase 3"
./scripts/smoke-test.sh "Phase 4 - Old Structure Removal"
```

#### **Phase 5 Testing**
```bash
./scripts/comprehensive-test.sh "Phase 5 - Final"
./scripts/integration-test.sh "Phase 5 - Final"
./scripts/regression-test.sh "compare" "Phase 4"
./scripts/smoke-test.sh "Phase 5 - Final"
```

### **Testing Rollback Strategy**

#### **Automatic Rollback on Failure**
```bash
if [ $? -ne 0 ]; then
    echo "❌ Testing failed - rolling back..."
    git reset --hard HEAD~1
    exit 1
fi
```

#### **Manual Rollback Commands**
```bash
# Rollback to specific commit
git reset --hard <commit-hash>

# Rollback to previous phase
git reset --hard HEAD~1

# Check rollback status
git log --oneline -5
./scripts/comprehensive-test.sh "Rollback Test"
```

### **Testing Success Criteria**

#### **Must Pass for Each Phase**
- ✅ Build succeeds without errors
- ✅ All critical files exist
- ✅ App structure is correct
- ✅ No broken imports
- ✅ All feature checks pass
- ✅ App starts successfully
- ✅ Critical flows work
- ✅ No regressions detected

#### **Warning Indicators**
- ⚠️ Build time increased significantly
- ⚠️ Bundle size increased significantly
- ⚠️ Import structure changed unexpectedly
- ⚠️ Components/services missing
- ⚠️ Navigation issues

#### **Failure Indicators**
- ❌ Build fails
- ❌ Critical files missing
- ❌ App won't start
- ❌ Critical flows broken
- ❌ Regressions detected
- ❌ Integration issues

---

## **Import Boundary Rules (App-Based)**
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
