# SRC Cleanup Implementation Plan
## Low-Risk, Incremental Restructuring with Complete Testing

### **Backup Status**
✅ **Complete backup created**: Commit `eb117926` with tag `backup-before-src-cleanup`
✅ **Restore command**: `git checkout backup-before-src-cleanup`

---

## **Phase 0: Safety Net & Baseline (Day 1)**

### **0.1 Current State Analysis**
```bash
# Run baseline tests to ensure everything works
npm ci
npm run build
npm test
./comprehensive-inventory-check.sh
```

### **0.2 Feature Presence Gates**
Add gates to prevent regressions we've seen:
```bash
# Create feature-presence checks
./scripts/check-mfa-features.sh
./scripts/check-oauth-features.sh
./scripts/check-protect-features.sh
```

### **0.3 Import Boundary Enforcement**
Create ESLint rules to prevent accidental cross-app imports:
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/apps/v8/**',
            from: './src/apps/v8u/**',
            message: 'V8 should not import from V8U without explicit approval'
          },
          {
            target: './src/apps/v8u/**', 
            from: './src/apps/v8/**',
            message: 'V8U should not import from V8 without explicit approval'
          },
          {
            target: './src/shared/**',
            from: './src/apps/**',
            message: 'Shared code must not import from app-specific code'
          }
        ]
      }
    ]
  }
}
```

---

## **Phase 1: Create Target Structure (Day 1)**

### **1.1 Create Empty Folders**
```bash
# Create target structure
mkdir -p src/apps/{v8,v8u,protect}/{pages,features,components,services}
mkdir -p src/shared/{components,services,hooks,lib,utils,contexts,constants,types,styles}
mkdir -p src/server src/config src/tests
```

### **1.2 Add Index Files**
Create `index.ts` files for each app folder to establish boundaries.

### **1.3 Testing**
```bash
# Verify structure created correctly
npm run build
./comprehensive-inventory-check.sh
```

---

## **Phase 2: Move Truly Shared Code (Day 2)**

### **2.1 Priority Order (Lowest Risk First)**
1. `src/utils` → `src/shared/utils`
2. `src/lib` → `src/shared/lib` 
3. `src/types` → `src/shared/types`
4. `src/hooks` → `src/shared/hooks`
5. `src/contexts` → `src/shared/contexts`

### **2.2 Process Per Directory**
```bash
# Example for utils
git mv src/utils/* src/shared/utils/
rmdir src/utils
# Update all imports
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "from.*utils" | xargs sed -i 's|from.*utils|from ../shared/utils|g'
npm run build
npm test
./comprehensive-inventory-check.sh
git commit -m "Phase 2.1: Move utils to shared/utils"
```

### **2.3 Testing After Each Move**
- ✅ Build passes
- ✅ Tests pass  
- ✅ Inventory check passes
- ✅ Feature gates pass

---

## **Phase 3: Split App Code (Day 3-4)**

### **3.1 V8 App First**
Move V8-specific code to `src/apps/v8/`:

**High Signal First:**
- `src/v8/pages/` → `src/apps/v8/pages/`
- `src/v8/flows/` → `src/apps/v8/features/`
- `src/v8/config/` → `src/apps/v8/config/`

**Then Components:**
- `src/v8/components/` → `src/apps/v8/components/`

**Then Services:**
- `src/v8/services/` → `src/apps/v8/services/`

### **3.2 V8U App Second**
Same pattern for V8U:
- `src/v8u/pages/` → `src/apps/v8u/pages/`
- `src/v8u/flows/` → `src/apps/v8u/features/`
- `src/v8u/components/` → `src/apps/v8u/components/`
- `src/v8u/services/` → `src/apps/v8u/services/`

### **3.3 Protect Portal Third**
- `src/pages/protect-portal/` → `src/apps/protect/pages/`
- Move protect-specific components/services

### **3.4 Testing Strategy Per App**
```bash
# After each app move
npm run build
npm test
./comprehensive-inventory-check.sh
# Test specific app functionality
npm run test:v8  # if available
# Manual smoke test: visit key pages for that app
```

---

## **Phase 4: Consolidate Components (Day 5)**

### **4.1 Identify Truly Shared vs App-Specific**
```bash
# Analyze src/components/
find src/components -name "*.tsx" | head -10
# Check usage across apps
grep -r "Button" src/apps/v8/ | wc -l
grep -r "Button" src/apps/v8u/ | wc -l
grep -r "Button" src/apps/protect/ | wc -l
```

### **4.2 Move Strategy**
- **Highly shared** (>2 apps use) → `src/shared/components/`
- **App-specific** → respective `src/apps/<app>/components/`
- **Single-use** → keep with the app that uses it

### **4.3 Update Imports**
Systematically update import paths after moves.

---

## **Phase 5: Cleanup & Finalization (Day 6)**

### **5.1 Remove Old Directories**
```bash
# Only after all imports updated
rmdir src/v8 src/v8u src/components src/utils src/lib src/types src/hooks src/contexts
```

### **5.2 Tighten Import Rules**
Update ESLint rules to be more restrictive.

### **5.3 Update Package Scripts**
Add app-specific build/test scripts if needed:
```json
{
  "scripts": {
    "build:v8": "vite build --config vite.v8.config.ts",
    "build:v8u": "vite build --config vite.v8u.config.ts", 
    "build:protect": "vite build --config vite.protect.config.ts",
    "test:v8": "jest --testPathPattern=v8",
    "test:v8u": "jest --testPathPattern=v8u",
    "test:protect": "jest --testPathPattern=protect"
  }
}
```

---

## **Testing Strategy**

### **Automated Testing (Every Phase)**
```bash
# Core functionality
npm ci
npm run build
npm test

# Regression prevention
./comprehensive-inventory-check.sh

# Feature presence
./scripts/check-mfa-features.sh
./scripts/check-oauth-features.sh  
./scripts/check-protect-features.sh

# Import boundary enforcement
npm run lint
```

### **Manual Testing (Per App)**
After each app move:
1. **V8 App**: Visit `/v8/*` pages, test MFA flows, worker token functionality
2. **V8U App**: Visit `/v8u/*` pages, test OAuth flows, unified components  
3. **Protect Portal**: Visit protect portal pages, test authentication

### **Critical Path Testing**
Must verify these work after restructuring:
- ✅ MFA device registration (we just fixed this!)
- ✅ Worker token generation/import
- ✅ OAuth flows (auth code, implicit, etc.)
- ✅ Navigation between apps
- ✅ Shared components render correctly

---

## **Rollback Strategy**

### **Complete Rollback**
```bash
git checkout backup-before-src-cleanup
# Everything restored to pre-cleanup state
```

### **Partial Rollback**
If a specific phase causes issues:
```bash
# Identify the problematic commit
git log --oneline
git checkout <commit-before-problematic-phase>
# Continue with different approach
```

---

## **Risk Mitigation**

### **High Risk Areas**
1. **Import updates** - Use automated find/replace with verification
2. **Shared components** - Test in isolation before moving
3. **Build configuration** - Update gradually, test each change
4. **Routing/navigation** - Test all routes after restructuring

### **Safety Checks**
- Each phase creates a git commit
- Automated tests must pass before proceeding
- Manual smoke tests for affected apps
- Import boundary rules enforced from start

---

## **Success Criteria**

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

## **Timeline**
- **Day 1**: Phase 0-1 (Safety net + structure)
- **Day 2**: Phase 2 (Shared utilities)
- **Day 3-4**: Phase 3 (App splitting)
- **Day 5**: Phase 4 (Component consolidation)  
- **Day 6**: Phase 5 (Cleanup + finalization)

**Total**: 6 days with testing at each step

---

## **Commands for Quick Reference**

### **Start Cleanup**
```bash
git checkout backup-before-src-cleanup  # If need to restart
npm ci
npm run build
npm test
./comprehensive-inventory-check.sh
```

### **Check Progress**
```bash
git log --oneline --since="backup-before-src-cleanup"
./comprehensive-inventory-check.sh
npm run build
```

### **Emergency Rollback**
```bash
git checkout backup-before-src-cleanup
npm ci
npm run build
```
