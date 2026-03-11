# Regression Prevention Workflow

## Overview
This workflow ensures all code changes follow the regression prevention process to maintain code quality and prevent regressions.

## When to Use This Workflow
- **Before editing** any regression-sensitive files
- **After fixing** any bug or implementing any feature
- **During code review** to ensure compliance
- **Before committing** changes to verify documentation

## Workflow Steps

### Step 1: Pre-Change Analysis
**Trigger**: About to edit sensitive files (worker token, sidebar, modals, discovery, etc.)

**Actions**:
1. **Read UPDATE_LOG_AND_REGRESSION_PLAN.md** - Section 4 (Regression Checklist)
2. **Review Section 7** (Do-Not-Break Areas) for your target area
3. **Search the document** for your feature/component
4. **Identify existing regression checks** that apply
5. **Understand the impact** of your planned changes

**Verification**:
- [ ] I have read the relevant regression checklist items
- [ ] I understand the do-not-break areas for my changes
- [ ] I know what existing checks apply to my work

### Step 2: Implementation
**Trigger**: Ready to make code changes

**Actions**:
1. **Make your code changes** following best practices
2. **Test your changes** thoroughly
3. **Verify existing functionality** still works
4. **Check for potential regressions** in related areas

**Verification**:
- [ ] My changes work as intended
- [ ] Existing functionality is preserved
- [ ] No new regressions introduced

### Step 3: Documentation
**Trigger**: Code changes are complete and tested

**Actions**:
1. **Add Update Log Entry** to UPDATE_LOG_AND_REGRESSION_PLAN.md:
   ```markdown
   - **[Feature Name] (YYYY-MM-DD)**
     - **What:** Brief description of what was wrong
     - **Cause:** Why it happened
     - **Fix:** What was changed and where
     - **Files:** List of affected files
     - **Regression check:** 1-2 concrete verification steps
   ```

2. **Add Regression Checklist Item** (if applicable):
   ```markdown
   - [ ] **[Area]:** When you change [specific component/behavior], verify [expected outcome].
   ```

3. **Update Do-Not-Break Areas** (if new area):
   - Add entry to Section 7 table
   - Include key files and what not to break

**Verification**:
- [ ] Update log entry is complete and accurate
- [ ] Regression check steps are concrete and testable
- [ ] New do-not-break areas are documented (if applicable)

### Step 4: Final Review
**Trigger**: Ready to commit changes

**Actions**:
1. **Review your documentation** for completeness
2. **Run your regression checks** to verify they work
3. **Test edge cases** and boundary conditions
4. **Ensure no breaking changes** without proper documentation

**Verification**:
- [ ] Documentation is complete and accurate
- [ ] Regression checks pass
- [ ] No unintended side effects
- [ ] Ready for code review

## Quick Reference

### Update Log Template
```markdown
- **[Feature Name] (YYYY-MM-DD)**
  - **What:** [One-line description of the problem]
  - **Cause:** [Why it happened]
  - **Fix:** [What was changed and where]
  - **Files:** [Comma-separated list of files]
  - **Regression check:** [1-2 concrete verification steps]
```

### Regression Checklist Template
```markdown
- [ ] **[Area]:** When you change [specific component/behavior], verify [expected outcome].
```

### Common Areas and Checks
- **Worker Token**: Storage priority, token source, environments page
- **Sidebar**: Z-index, drag-and-drop, menu configuration
- **Modals**: Z-index hierarchy, DOM structure, accessibility
- **Discovery**: Logger methods, success/error handling
- **Buttons**: Styling, V9_COLORS interpolation, disabled states
- **Icons**: Import statements, proper usage

## Examples

### Example 1: Worker Token Fix
```markdown
- **Worker token storage priority (2025-03-11)**
  - **What:** Credentials not loading consistently across apps
  - **Cause:** Storage priority mismatch between V9 and unified storage
  - **Fix:** Reversed loading priority to unified first, V9 fallback
  - **Files:** WorkerTokenModalV9.tsx, useGlobalWorkerToken.ts
  - **Regression check:** Save credentials in modal → open environments page → environments load
```

### Example 2: Modal Z-Index Fix
```markdown
- **Modal z-index hierarchy (2025-03-11)**
  - **What:** Modals covered by dropdowns with higher z-index
  - **Cause:** Z-index hierarchy didn't account for all components
  - **Fix:** Updated DraggableModal to z-index 12002/12003
  - **Files:** DraggableModal.tsx
  - **Regression check:** Open modal → verify it appears above all other UI elements
```

## Quality Gates

### Must Pass (Blocking)
- [ ] Update log entry added to UPDATE_LOG_AND_REGRESSION_PLAN.md
- [ ] Regression check steps are concrete and testable
- [ ] No breaking changes without documentation
- [ ] Existing regression checks still pass

### Should Pass (Team Approval)
- [ ] New regression checklist item added (if applicable)
- [ ] Do-not-break areas updated (if new area)
- [ ] Documentation follows established format
- [ ] Changes align with existing patterns

## Integration

### IDE Integration
- Windsurf automatically triggers this workflow for sensitive files
- Provides guidance and templates for documentation
- Ensures compliance before allowing commits

### Code Review Integration
- Reviewers check for UPDATE_LOG_AND_REGRESSION_PLAN.md updates
- Verify regression checks are adequate
- Ensure documentation quality and completeness

### Pre-commit Integration
- Consider adding pre-commit hooks to verify documentation
- Check for required updates to regression plan
- Prevent commits without proper documentation

## Success Metrics

### Process Compliance
- **100%** of sensitive file changes follow this workflow
- **0** regressions of previously fixed issues
- **Complete documentation** for all fixes and changes

### Quality Improvement
- **Reduced bug recurrence** rates
- **Faster onboarding** for new team members
- **Better knowledge transfer** between team members
- **Improved code review** efficiency

---

**Remember**: This workflow protects our codebase from regressions and ensures long-term maintainability. When in doubt, follow the process!
