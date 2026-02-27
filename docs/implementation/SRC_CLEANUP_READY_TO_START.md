# SRC Cleanup - Ready to Start! 🚀

## **Backup Status** ✅
- **Complete backup created**: Commit `eb117926` with tag `backup-before-src-cleanup`
- **Restore command**: `git checkout backup-before-src-cleanup`
- **Current baseline**: All builds pass, all feature checks pass

---

## **Safety Net Status** ✅

### **Feature Presence Gates Created**
- ✅ `./scripts/check-mfa-features.sh` - All MFA features verified
- ✅ `./scripts/check-oauth-features.sh` - All OAuth features verified  
- ✅ `./scripts/check-protect-features.sh` - All Protect Portal features verified

### **Baseline Tests Pass**
```bash
✅ npm run build  # 16.07s, no errors
✅ ./scripts/check-mfa-features.sh
✅ ./scripts/check-oauth-features.sh  
✅ ./scripts/check-protect-features.sh
```

---

## **Implementation Plan Ready** 📋

### **Phase 0: Complete** ✅
- ✅ Backup created and tagged
- ✅ Feature presence gates working
- ✅ Baseline tests passing

### **Phase 1: Create Target Structure** (Day 1)
```bash
# Create empty folders
mkdir -p src/apps/{v8,v8u,protect}/{pages,features,components,services}
mkdir -p src/shared/{components,services,hooks,lib,utils,contexts,constants,types,styles}
mkdir -p src/server src/config src/tests

# Add index files and test
npm run build
./scripts/check-*.sh
```

### **Phase 2: Move Shared Code** (Day 2)
**Priority Order:**
1. `src/utils` → `src/shared/utils`
2. `src/lib` → `src/shared/lib` 
3. `src/types` → `src/shared/types`
4. `src/hooks` → `src/shared/hooks`
5. `src/contexts` → `src/shared/contexts`

**Per Directory Process:**
```bash
git mv src/utils/* src/shared/utils/
# Update imports
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*utils|from ../shared/utils|g'
npm run build && npm test && ./scripts/check-*.sh
git commit -m "Phase 2.1: Move utils to shared/utils"
```

### **Phase 3: Split App Code** (Day 3-4)

#### **V8 App First**
```bash
# High signal first
git mv src/v8/pages/* src/apps/v8/pages/
git mv src/v8/flows/* src/apps/v8/features/
git mv src/v8/config/* src/apps/v8/config/

# Then components/services
git mv src/v8/components/* src/apps/v8/components/
git mv src/v8/services/* src/apps/v8/services/

# Update imports and test
npm run build && npm test && ./scripts/check-*.sh
```

#### **V8U App Second**
```bash
git mv src/v8u/pages/* src/apps/v8u/pages/
git mv src/v8u/flows/* src/apps/v8u/features/
git mv src/v8u/components/* src/apps/v8u/components/
git mv src/v8u/services/* src/apps/v8u/services/
```

#### **Protect Portal Third**
```bash
git mv src/pages/protect-portal/* src/apps/protect/
```

### **Phase 4: Consolidate Components** (Day 5)
```bash
# Analyze shared vs app-specific
find src/components -name "*.tsx" | head -10
grep -r "Button" src/apps/v8/ | wc -l
grep -r "Button" src/apps/v8u/ | wc -l

# Move accordingly
# Highly shared → src/shared/components/
# App-specific → src/apps/<app>/components/
```

### **Phase 5: Cleanup & Finalization** (Day 6)
```bash
# Remove old directories
rmdir src/v8 src/v8u src/components src/utils src/lib src/types src/hooks src/contexts

# Update package scripts if needed
# Tighten import rules
```

---

## **Testing Strategy** 🧪

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

### **Manual (Per App)**
After each app move:
- **V8**: Visit `/v8/*` pages, test MFA flows, worker token functionality
- **V8U**: Visit `/v8u/*` pages, test OAuth flows, unified components  
- **Protect**: Visit protect portal pages, test authentication

### **Critical Path Verification**
Must verify these work after restructuring:
- ✅ MFA device registration (we just fixed this!)
- ✅ Worker token generation/import
- ✅ OAuth flows (auth code, implicit, etc.)
- ✅ Navigation between apps
- ✅ Shared components render correctly

---

## **Risk Mitigation** 🛡️

### **Complete Rollback**
```bash
git checkout backup-before-src-cleanup
npm ci && npm run build
# Everything restored to pre-cleanup state
```

### **Partial Rollback**
```bash
git log --oneline --since="backup-before-src-cleanup"
git checkout <commit-before-problematic-phase>
# Continue with different approach
```

### **Safety Checks**
- Each phase creates a git commit
- Automated tests must pass before proceeding
- Manual smoke tests for affected apps
- Import boundary rules enforced from start

---

## **Success Criteria** ✨

### **Technical**
✅ All builds pass
✅ All tests pass  
✅ Inventory checks pass
✅ Import boundaries enforced
✅ No circular dependencies

### **Functional**
✅ All apps work as before
✅ No regressions in user workflows
✅ Shared components function correctly
✅ Navigation between apps works

### **Maintainability**
✅ Clear app boundaries
✅ Obvious blast radius for changes
✅ Automated gates prevent regressions
✅ Easy to determine "impacted apps"

---

## **Ready to Start! 🎯**

**Current Status**: All safety nets in place, baseline verified, backup created
**Next Step**: Begin Phase 1 - Create target structure
**Timeline**: 6 days with testing at each step
**Risk Level**: Low (incremental, reversible, well-tested)

---

## **Quick Reference Commands**

### **Start Phase 1**
```bash
# Verify current state
npm run build
./scripts/check-*.sh

# Create target structure
mkdir -p src/apps/{v8,v8u,protect}/{pages,features,components,services}
mkdir -p src/shared/{components,services,hooks,lib,utils,contexts,constants,types,styles}
mkdir -p src/server src/config src/tests

# Test structure
npm run build
./scripts/check-*.sh
git commit -m "Phase 1: Create target structure"
```

### **Emergency Rollback**
```bash
git checkout backup-before-src-cleanup
npm ci && npm run build
```

### **Check Progress**
```bash
git log --oneline --since="backup-before-src-cleanup"
./comprehensive-inventory-check.sh
npm run build
```

---

**🚀 Ready to begin Phase 1 when you give the go-ahead!**
