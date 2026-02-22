# Worker Token UI Regression Test

## Purpose
This test ensures worker token button colors work correctly and prevents regressions.

## 🧪 Test Cases

### Test Case 1: Button Color Logic
**Objective**: Verify button changes color based on token validity

#### Test Steps:
1. Navigate to Delete All Devices utility
2. Check initial button color (should be red - no token)
3. Configure a valid worker token
4. Verify button changes to green
5. Expire/delete the token
6. Verify button returns to red

#### Expected Results:
- **Red Button**: `btn-light-red` class when `tokenStatus.isValid = false`
- **Green Button**: `btn-light-green` class when `tokenStatus.isValid = true`
- **Smooth Transitions**: Color changes should be immediate

#### Browser Console Test:
```javascript
// Check button class
const button = document.querySelector('button:has(.mdi-key)');
console.log('Button classes:', button.className);
console.log('Token status:', window.deleteAllDevicesState?.tokenStatus);

// Force color change test
window.deleteAllDevicesState?.setTokenStatus({ isValid: true, minutesRemaining: 30 });
setTimeout(() => console.log('Button should be green:', button.className), 100);

window.deleteAllDevicesState?.setTokenStatus({ isValid: false, minutesRemaining: 0 });
setTimeout(() => console.log('Button should be red:', button.className), 100);
```

### Test Case 2: CSS Class Application
**Objective**: Verify CSS classes are properly applied and styled

#### Test Steps:
1. Open browser DevTools
2. Inspect the worker token button
3. Verify CSS classes are applied
4. Check computed styles

#### Expected Results:
```css
/* When token is valid */
.end-user-nano .btn-light-green {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

/* When token is invalid */
.end-user-nano .btn-light-red {
  background-color: #f8d7da;
  border-color: #f5c2c7;
  color: #721c24;
}
```

#### Browser Console Test:
```javascript
// Check computed styles
const button = document.querySelector('button:has(.mdi-key)');
const styles = window.getComputedStyle(button);
console.log('Background color:', styles.backgroundColor);
console.log('Border color:', styles.borderColor);
console.log('Text color:', styles.color);
```

### Test Case 3: State Synchronization
**Objective**: Verify token status state updates correctly

#### Test Steps:
1. Monitor token status updates
2. Trigger token status changes
3. Verify state updates propagate to button

#### Expected Results:
- State changes trigger immediate UI updates
- No delayed or missed updates
- Consistent state across component

#### Browser Console Test:
```javascript
// Monitor state changes
let lastStatus = null;
const observer = new MutationObserver(() => {
  const button = document.querySelector('button:has(.mdi-key)');
  if (button) {
    const currentClass = button.className;
    if (currentClass !== lastStatus) {
      console.log('Button class changed:', currentClass);
      lastStatus = currentClass;
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class']
});
```

## 🔧 Automated Test Script

### Selenium/Playwright Test Example
```javascript
// test/worker-token-ui.spec.js
test('worker token button color changes', async ({ page }) => {
  await page.goto('/delete-all-devices');
  
  // Initial state - should be red
  const button = page.locator('button:has-text("Configure Worker Token")');
  await expect(button).toHaveClass(/btn-light-red/);
  await expect(button).not.toHaveClass(/btn-light-green/);
  
  // Configure valid token
  await page.click('button:has-text("Configure Worker Token")');
  // ... fill token form ...
  await page.click('button:has-text("Generate Token")');
  
  // Should be green after valid token
  await expect(button).toHaveClass(/btn-light-green/);
  await expect(button).not.toHaveClass(/btn-light-red/);
});
```

## 🐛 Common Issues & Solutions

### Issue 1: CSS Classes Not Applied
**Symptoms**: Button has correct class but wrong color
**Causes**: 
- Missing `.end-user-nano` wrapper
- CSS not imported
- Class name typo

**Debug Steps**:
```javascript
// Check wrapper exists
console.log('Has end-user-nano:', document.querySelector('.end-user-nano') !== null);

// Check CSS exists
const styles = Array.from(document.styleSheets)
  .flatMap(sheet => Array.from(sheet.cssRules))
  .filter(rule => rule.selectorText?.includes('.btn-light-green'));
console.log('CSS rules found:', styles.length);
```

### Issue 2: State Not Updating
**Symptoms**: Button color doesn't change when token status changes
**Causes**:
- Missing useEffect for token status
- Service not called
- Type mismatch in setTokenStatus

**Debug Steps**:
```javascript
// Check service is working
WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
  .then(status => console.log('Service status:', status))
  .catch(error => console.error('Service error:', error));

// Check state updates
const component = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1);
// Look for DeleteAllDevicesUtilityV8 component state
```

### Issue 3: CSS Namespace Issues
**Symptoms**: Classes applied but styles not taking effect
**Causes**:
- Component not wrapped in `.end-user-nano`
- CSS specificity issues

**Debug Steps**:
```javascript
// Check computed styles vs expected
const button = document.querySelector('button:has(.mdi-key)');
const computed = window.getComputedStyle(button);
console.log('Computed background:', computed.backgroundColor);
console.log('Expected green:', 'rgb(212, 237, 218)'); // #d4edda
console.log('Expected red:', 'rgb(248, 215, 218)');    // #f8d7da
```

## 📊 Test Results Template

### Test Execution Log
```
Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]

Test Case 1: Button Color Logic
- Initial state: PASS/FAIL
- Valid token: PASS/FAIL  
- Invalid token: PASS/FAIL
- Notes: [OBSERVATIONS]

Test Case 2: CSS Class Application
- Red button styles: PASS/FAIL
- Green button styles: PASS/FAIL
- Computed styles: PASS/FAIL
- Notes: [OBSERVATIONS]

Test Case 3: State Synchronization
- State updates: PASS/FAIL
- UI responsiveness: PASS/FAIL
- Consistency: PASS/FAIL
- Notes: [OBSERVATIONS]

Overall Result: PASS/FAIL
```

## 🚨 Regression Alerts

### Critical Failures
- Button always red regardless of token status
- Button always green regardless of token status
- CSS classes not applied
- State not updating

### Warning Signs
- Delayed color changes (>1 second)
- Inconsistent behavior across browsers
- Console errors related to token status

### Immediate Actions Required
1. Stop deployment if critical failures detected
2. Check CSS imports and namespace
3. Verify token status service integration
4. Test state management implementation

## 📝 Maintenance

### Weekly Checks
- [ ] Verify button colors in all environments
- [ ] Check for CSS conflicts in new deployments
- [ ] Test token status service reliability

### Monthly Reviews
- [ ] Update test cases for new features
- [ ] Review CSS for performance issues
- [ ] Check browser compatibility

### Version Updates
- [ ] Update documentation when CSS changes
- [ ] Add new test cases for additional components
- [ ] Maintain cross-browser compatibility

---

**Remember**: This test prevents UI regressions. Run it before every deployment!
