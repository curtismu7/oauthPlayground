# ZERO TOLERANCE MIGRATION RULES - Feature Parity Enforcement

**Date:** March 2, 2026  
**Status:** IMMEDIATE IMPLEMENTATION REQUIRED  
**Priority:** 🔴 **CRITICAL** - Prevents functionality loss

---

## 🚨 **CRITICAL MIGRATION RULE #1: ZERO FUNCTIONALITY LOSS**

### **MANDATORY REQUIREMENT**
**Every V9 migration MUST maintain 100% feature parity with V7/V8 predecessors.**

**No exceptions. No compromises. No "we'll add it later".**

---

## 📋 **MANDATORY MIGRATION CHECKLIST**

### **Phase 1: Pre-Migration Analysis**
- [ ] **Complete Feature Inventory**: Document ALL features from source version
- [ ] **Function Mapping**: Map every function to V9 equivalent  
- [ ] **Component Analysis**: List all UI components and their behavior
- [ ] **Service Dependencies**: Identify all service integrations
- [ ] **State Management**: Document all state variables and their purpose
- [ ] **User Workflows**: Map complete user journeys through the feature
- [ ] **Error Handling**: Document all error scenarios and handling
- [ ] **Data Persistence**: Identify all data storage/retrieval mechanisms
- [ ] **URL Configuration**: Identify all hardcoded localhost URLs and domain references
- [ ] **Worker Token Implementation**: Identify all custom worker token buttons and status displays
- [ ] **HTTPS Usage**: Identify all HTTP URLs that should be HTTPS
- [ ] **Port Configuration**: Identify all dynamic or non-standard port configurations

### **Phase 2: Migration Implementation**
- [ ] **Feature-by-Feature Migration**: Implement ONE feature at a time
- [ ] **Function Preservation**: Every function must have V9 equivalent
- [ ] **UI Component Migration**: Every UI element must be preserved
- [ ] **Service Integration**: All service dependencies must be migrated
- [ ] **State Parity**: All state management must be preserved
- [ ] **Workflow Integrity**: Complete user workflows must work identically
- [ ] **Error Handling Parity**: All error scenarios must be handled
- [ ] **Data Persistence**: All save/load functionality must work
- [ ] **URL Configuration**: All URLs must be dynamic and environment-aware
- [ ] **Worker Token Standardization**: Must use V9WorkerTokenUIService only
- [ ] **HTTPS Enforcement**: All URLs must use HTTPS protocol
- [ ] **Port Standardization**: Frontend=3000, Backend=3001 only

### **Phase 3: Post-Migration Verification**
- [ ] **Feature Parity Test**: Every V7 feature works in V9
- [ ] **UI Comparison**: Every UI element exists and functions
- [ ] **Service Integration Test**: All service calls work correctly
- [ ] **State Management Test**: All state variables work correctly
- [ ] **Workflow Test**: Complete user workflows work end-to-end
- [ ] **Error Handling Test**: All error scenarios are handled properly
- [ ] **Data Persistence Test**: Save/load functionality works
- [ ] **Performance Test**: No performance regressions
- [ ] **URL Configuration Test**: All URLs work in customer domains
- [ ] **Worker Token Consistency Test**: All flows use V9WorkerTokenUIService
- [ ] **HTTPS Compliance Test**: All URLs use HTTPS protocol
- [ ] **Port Configuration Test**: Frontend=3000, Backend=3001

---

## 🧪 **MANDATORY TESTING FRAMEWORK**

### **Pre-Migration Test Suite**
```typescript
// MUST BE RUN BEFORE ANY MIGRATION
describe('V7 Feature Inventory - JWT Bearer Token Flow', () => {
  it('should document all features', () => {
    const features = [
      'Multi-step wizard flow',
      'Collapsible sections', 
      'Credential service integration',
      'OIDC discovery integration',
      'Environment ID management',
      'JWT claims management',
      'Token request/response handling',
      'Step navigation system',
      'Data persistence',
      'Comprehensive validation',
      'Modal system integration',
      'Styled components system',
      // ... ALL features must be listed
    ];
    
    features.forEach(feature => {
      expect(feature).toBeDefined();
    });
  });
});
```

### **Post-Migration Test Suite**
```typescript
// MUST BE RUN AFTER ANY MIGRATION
describe('V9 Feature Parity - JWT Bearer Token Flow', () => {
  it('should maintain 100% feature parity with V7', () => {
    const v7Features = getV7Features();
    const v9Features = getV9Features();
    
    v7Features.forEach(feature => {
      expect(v9Features).toContain(feature);
    });
  });
  
  it('should preserve all user workflows', () => {
    // Test complete user journey
    const userWorkflow = executeCompleteWorkflow();
    expect(userWorkflow.success).toBe(true);
  });
  
  it('should maintain all service integrations', () => {
    // Test all service dependencies
    const services = getAllServiceDependencies();
    services.forEach(service => {
      expect(service.isWorking()).toBe(true);
    });
  });
});
```

---

## 📊 **FEATURE PARITY TRACKING TEMPLATE**

### **Migration Tracking Sheet**
```markdown
## [FEATURE NAME] Migration Tracking

### Source Analysis (V7/V8)
- **Functions**: [List all functions]
- **Components**: [List all UI components]  
- **State Variables**: [List all state]
- **Service Dependencies**: [List all services]
- **User Workflows**: [List all workflows]
- **Error Handling**: [List all error scenarios]
- **Data Persistence**: [List all save/load mechanisms]

### Target Implementation (V9)
- **Functions Migrated**: [Track each function]
- **Components Migrated**: [Track each component]
- **State Variables Migrated**: [Track each state variable]
- **Service Dependencies Migrated**: [Track each service]
- **User Workflows Tested**: [Track each workflow]
- **Error Handling Tested**: [Track each error scenario]
- **Data Persistence Tested**: [Track each save/load mechanism]

### Parity Verification
- [ ] All functions implemented
- [ ] All components working
- [ ] All state variables working
- [ ] All service integrations working
- [ ] All user workflows tested
- [ ] All error scenarios tested
- [ ] All data persistence working
- [ ] Performance maintained
- [ ] No regressions detected

### Sign-off
- **Developer**: [Name] - Date: [Date]
- **QA Tester**: [Name] - Date: [Date]
- **Migration Lead**: [Name] - Date: [Date]
```

---

## 🚫 **FORBIDDEN MIGRATION PRACTICES**

### **NEVER DO THIS**
- ❌ **Migrate without feature inventory**
- ❌ **Assume features are "optional"**
- ❌ **Implement partial functionality**
- ❌ **Skip error handling migration**
- ❌ **Ignore service dependencies**
- ❌ **Deplete state management**
- ❌ **Simplify user workflows**
- ❌ **Remove UI components**
- ❌ **Skip data persistence**
- ❌ **Assume "good enough" is acceptable**

### **ALWAYS DO THIS**
- ✅ **Document EVERY feature first**
- ✅ **Map ALL functions to V9 equivalents**
- ✅ **Preserve ALL UI components**
- ✅ **Migrate ALL service dependencies**
- ✅ **Maintain ALL state management**
- ✅ **Preserve ALL user workflows**
- ✅ **Handle ALL error scenarios**
- ✅ **Maintain ALL data persistence**
- ✅ **Test EVERYTHING thoroughly**

---

## 🔄 **AUTOMATED TESTING PIPELINE**

### **Pre-Migration Gate**
```bash
# MUST PASS BEFORE MIGRATION STARTS
npm run test:feature-inventory
npm run test:v7-baseline
npm run test:dependency-analysis
```

### **Post-Migration Gate**
```bash
# MUST PASS BEFORE MIGRATION COMPLETES
npm run test:feature-parity
npm run test:workflow-integrity
npm run test:service-integration
npm run test:performance-regression
```

### **Continuous Monitoring**
```bash
# RUN DAILY TO PREVENT REGRESSIONS
npm run test:migration-parity
npm run test:feature-completeness
npm run test:integrity-check
```

---

## 📝 **MIGRATION DOCUMENTATION REQUIREMENTS**

### **Required Documents for Each Migration**
1. **Feature Inventory Document** - Complete list of all features
2. **Migration Plan Document** - Step-by-step migration approach
3. **Tracking Document** - Progress tracking for each feature
4. **Test Results Document** - Complete test results
5. **Sign-off Document** - Final approval and sign-off

### **Document Templates**
See `/A-Migration/TEMPLATES/` directory for standardized templates.

---

## 🎯 **QUALITY GATES**

### **Migration Cannot Proceed Until:**
- [ ] **100% Feature Inventory Complete**
- [ ] **Migration Plan Approved**
- [ ] **Test Suite Written**
- [ ] **Quality Gates Defined**
- [ ] **Stakeholder Sign-off**

### **Migration Cannot Be Marked Complete Until:**
- [ ] **100% Feature Parity Achieved**
- [ ] **All Tests Pass**
- [ ] **No Regressions Detected**
- [ ] **Performance Maintained**
- [ ] **Final Sign-off Received**

---

## 🚨 **IMMEDIATE ACTIONS REQUIRED**

### **For JWT Bearer Token Flow V9**
1. **STOP** all other work until parity is achieved
2. **IMPLEMENT** all missing V7 features immediately
3. **TEST** every feature thoroughly
4. **DOCUMENT** the complete migration
5. **VERIFY** 100% feature parity

### **For All Future Migrations**
1. **IMPLEMENT** this rule immediately
2. **TRAIN** all developers on these requirements
3. **ENFORCE** pre-migration testing
4. **REQUIRE** post-migration verification
5. **MONITOR** for compliance

---

## 📞 **ESCALATION PROCESS**

### **If Feature Loss is Detected:**
1. **IMMEDIATELY** stop the migration
2. **DOCUMENT** the missing features
3. **IMPLEMENT** the missing functionality
4. **TEST** thoroughly
5. **REVIEW** process to prevent recurrence

### **Quality Assurance Contact:**
- **Migration Lead**: [Contact Information]
- **QA Team**: [Contact Information]
- **Architecture Review Board**: [Contact Information]

---

## 📋 **COMPLIANCE CHECKLIST**

### **Before Starting Any Migration:**
- [ ] Read and understood these rules
- [ ] Completed feature inventory
- [ ] Written comprehensive test suite
- [ ] Got migration plan approved
- [ ] Scheduled quality gates

### **Before Completing Any Migration:**
- [ ] Achieved 100% feature parity
- [ ] All tests pass
- [ ] No regressions detected
- [ ] Performance maintained
- [ ] Got final sign-off

---

## 📝 **RULE: DOCUMENT LESSONS LEARNED AFTER EVERY SESSION**

After completing any migration work (even a partial session), **capture what you learned** in `A-Migration/V9_MIGRATION_LESSONS_LEARNED.md`.

### Mandatory captures:
- Any bug that required more than 10 minutes to diagnose
- Any pattern that changed between V7/V8 and V9 (API names, callback props, etc.)
- Any tool or process that saved time (or wasted it)
- Any silent failure mode (things tsc passes but break at runtime)

### Format:
```
### L[N] — Short title
**Problem:** what happened
**Fix:** what resolved it
**Prevention:** how to avoid it next time
```

**Why this matters:** The same bugs will recur across 16+ flow files. A 2-minute write-up prevents a 30-minute debug next time.

---

## 🧪 **RULE: RUN BIOME ON EVERY CHANGED FILE BEFORE COMMITTING**

After editing any `.tsx` / `.ts` file, run:

```bash
node_modules/.bin/biome check <file1> <file2> ...
```

Fix all errors. For warnings that are intentionally suppressed (e.g. partial dep arrays preventing infinite loops), add a `biome-ignore` comment with a reason.

### Auto-fix safe issues:
```bash
node_modules/.bin/biome check --write <file>
```

### After all files are clean:
```bash
node_modules/.bin/biome check --write --unsafe <file>   # only if needed
```

### What to never commit:
- `any` types — replace with `Record<string, unknown>`, a proper interface, or `unknown`
- Unused variables or parameters — prefix with `_` if intentional, remove if not
- Unsorted imports — auto-fixed by `--write`
- Long JSX lines that biome wants to break — auto-fixed by `--write`

**biome clean = commit ready. biome dirty = do not commit.**

---

**RULE STATUS:** 🔴 **IMMEDIATE IMPLEMENTATION REQUIRED**  
**COMPLIANCE:** 100% **MANDATORY**  
**EXCEPTIONS:** **NONE ALLOWED**  

**This rule applies to ALL V9 migrations without exception.**
