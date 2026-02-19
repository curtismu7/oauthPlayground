# SRC Cleanup - Simplified Unified Structure Plan
## Eliminate V8/V8U Distinctions, Consolidate Everything

### **Backup Status**
✅ **Complete backup created**: Commit `eb117926` with tag `backup-before-src-cleanup`
✅ **Restore command**: `git checkout backup-before-src-cleanup`

---

## **Target Layout (Simplified)**

```
src/
  v7/                       # V7 flows (keep separate for V9 upgrade)
    pages/
    components/
    services/
    flows/
    
  pages/                    # All V8+ pages (unified)
    oauth/
    mfa/
    protect/
    flows/
    docs/
    tools/
    
  components/               # All V8+ components (unified)
    oauth/
    mfa/
    shared/
    ui/
    
  services/                 # All V8+ services (unified)
    oauth/
    mfa/
    auth/
    storage/
    
  hooks/                    # All hooks (unified)
  utils/                    # All utilities (unified)
  types/                    # All types (unified)
  contexts/                 # All contexts (unified)
  
  server/                   # Backend API
  config/                   # Configuration
  tests/                    # Tests
```

### **Key Changes from Current Plan**
❌ **Remove**: `src/apps/v8/` and `src/apps/v8u/` separation  
✅ **Keep**: `src/v7/` separate (for V9 upgrade later)
✅ **Keep**: `src/pages/protect-portal/` (distinct app)  
✅ **Unify**: All V8+ OAuth/MFA flows under single structure  
✅ **Consolidate**: V8+ components and services by function, not version

---

## **Migration Strategy (Simplified)**

### **Phase 0: Safety Net** ✅ (Already Complete)
- Backup created
- Feature gates working
- Baseline tests pass

### **Phase 1: Create Unified Structure** (Day 1)
```bash
# Create V7 separate (for V9 upgrade later)
mkdir -p src/v7/{pages,components,services,flows}

# Create unified V8+ folders
mkdir -p src/pages/{oauth,mfa,protect,flows,docs,tools}
mkdir -p src/components/{oauth,mfa,shared,ui}
mkdir -p src/services/{oauth,mfa,auth,storage}
mkdir -p src/{hooks,utils,types,contexts,server,config,tests}

# Move V7 to its dedicated location
git mv src/v7m/* src/v7/
git mv src/v7/* src/v7/  # if any other V7 content

# Keep protect portal separate
git mv src/pages/protect-portal/ src/pages/protect/
```

### **Phase 2: Consolidate by Function** (Day 2-3)

#### **Pages Consolidation**
```bash
# OAuth pages (from v8u only - V7 stays separate)
git mv src/v8u/pages/* src/pages/oauth/

# MFA pages (from v8 only)
git mv src/v8/pages/* src/pages/mfa/

# Flow pages (from flows/)
git mv src/pages/flows/* src/pages/flows/

# Documentation and tools
git mv src/pages/docs/* src/pages/docs/
git mv src/pages/tools/* src/pages/tools/
```

#### **Components Consolidation**
```bash
# OAuth components
git mv src/v8u/components/* src/components/oauth/

# MFA components  
git mv src/v8/components/* src/components/mfa/

# Shared components (analyze usage first)
# Highly shared → src/components/shared/
# App-specific → keep with respective function
```

#### **Services Consolidation**
```bash
# OAuth services
git mv src/v8u/services/* src/services/oauth/

# MFA services
git mv src/v8/services/* src/services/mfa/

# Shared services (auth, storage, etc.)
git mv src/services/* src/services/auth/
```

### **Phase 3: Update Imports** (Day 4)
```bash
# Update all imports to new unified paths
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*v8/|from ../pages/mfa/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*v8u/|from ../pages/oauth/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*components/|from ../components/|g'

# Test after updates
npm run build
npm test
./scripts/check-*.sh
```

### **Phase 4: Remove Old Structure** (Day 5)
```bash
# Remove old versioned folders (keep V7)
rmdir src/v8 src/v8u src/v7m
# Clean up any remaining old structure
```

---

## **Import Boundary Rules (Simplified)**

### **Allowed**
- `src/pages/**` → may import from `src/components/**`, `src/services/**`, `src/hooks/**`, `src/utils/**`
- `src/components/**` → may import from `src/services/**`, `src/hooks/**`, `src/utils/**`, `src/types/**`
- `src/services/**` → may import from `src/hooks/**`, `src/utils/**`, `src/types/**`

### **Disallowed**
- Circular imports between same-level folders
- Components importing pages (wrong direction)
- Services importing components (wrong direction)

---

## **Benefits of Unified Structure**

### **Simplicity**
- No V8/V8U version confusion
- Clear functional organization
- V7 kept separate for future V9 upgrade
- Easier to find related code

### **Maintainability**
- Single source of truth for each function (V8+)
- V7 isolated for upgrade path
- Clear ownership by function area
- No duplicate code across versions

### **Development**
- Easier onboarding (no version complexity for V8+)
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
- **Navigation**: Test all routes work correctly

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
✅ Navigation between all pages works

### **Maintainability**
✅ Clear functional organization
✅ No version confusion
✅ Easy to locate code by function
✅ Simplified import paths

---

## **Timeline**
- **Day 1**: Phase 1 (Create unified structure)
- **Day 2-3**: Phase 2 (Consolidate by function)
- **Day 4**: Phase 3 (Update imports)
- **Day 5**: Phase 4 (Remove old structure)

**Total**: 5 days (simpler than original 6-day plan)

---

## **Ready to Start**

This simplified plan:
- ✅ Eliminates V8/V8U distinctions
- ✅ Consolidates everything by function
- ✅ Reduces complexity
- ✅ Maintains all functionality
- ✅ Provides clear rollback strategy

**Approve to begin Phase 1: Create unified structure**
