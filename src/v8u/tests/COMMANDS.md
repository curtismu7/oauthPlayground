# Test Commands Reference

## 🚀 Quick Commands

Open browser console (F12) and run:

### Run All Tests
```javascript
// Unit tests (logic validation)
runTokenExchangeTests()

// Integration tests (DOM validation)
await runIntegrationTests()

// Quick diagnostic check
checkTokenExchangeState()
```

---

## 📋 Command Details

### `runTokenExchangeTests()`
**Type**: Unit Tests  
**Tests**: 10 tests  
**What it does**: Validates logic and state management  
**Returns**: Array of test results  

**Example**:
```javascript
const results = runTokenExchangeTests()
console.table(results)
```

**Expected Output**:
```
✅ All tests passed! Token exchange flow is working correctly.
Total: 10 | Passed: 10 | Failed: 0
Success Rate: 100.0%
```

---

### `await runIntegrationTests()`
**Type**: Integration Tests  
**Tests**: 6 tests  
**What it does**: Validates actual DOM and browser behavior  
**Returns**: Promise<Array of test results>  

**Example**:
```javascript
const results = await runIntegrationTests()
console.table(results)
```

**Expected Output** (before completing flow):
```
✅ All applicable tests passed!
ℹ️ 4 test(s) skipped (complete OAuth flow to run all tests)
Total: 6 | Passed: 2 | Failed: 0 | Skipped: 4
```

**Expected Output** (after completing flow):
```
🎉 All integration tests passed!
✅ The fix is working correctly
Total: 6 | Passed: 6 | Failed: 0 | Skipped: 0
```

---

### `checkTokenExchangeState()`
**Type**: Diagnostic  
**What it does**: Quick check of current state  
**Returns**: Object with state information  

**Example**:
```javascript
const state = checkTokenExchangeState()
console.log(state)
```

**Output**:
```
📍 Location:
   Current: /v8u/unified/oauth-authz/3
   On flow page: ✅ Yes

💾 Storage:
   PKCE codes: ✅ Found
   Callback data: ✅ Found
   Tokens: ✅ Found

🎨 DOM Elements:
   Success message: ✅ Visible
   Exchange button: ✅ Hidden

🎯 Fix Status:
   ✅ FIX WORKING CORRECTLY
   - Tokens received
   - Button hidden
   - Success message shown
```

---

## 🎯 Test Scenarios

### Scenario 1: Before Starting Flow
**Location**: Any page  
**Expected**:
- Unit tests: ✅ All pass
- Integration tests: ⏭️ Most skipped
- Diagnostic: "NOT TESTED YET"

**Command**:
```javascript
checkTokenExchangeState()
```

---

### Scenario 2: During Flow (Before Token Exchange)
**Location**: `/v8u/unified/oauth-authz`  
**Expected**:
- Unit tests: ✅ All pass
- Integration tests: ⏭️ Some skipped
- Diagnostic: "FLOW NOT COMPLETED"

**Command**:
```javascript
await runIntegrationTests()
```

---

### Scenario 3: After Token Exchange (Fix Working)
**Location**: `/v8u/unified/oauth-authz/4`  
**Expected**:
- Unit tests: ✅ All pass (10/10)
- Integration tests: ✅ All pass (6/6)
- Diagnostic: "FIX WORKING CORRECTLY"

**Commands**:
```javascript
runTokenExchangeTests()
await runIntegrationTests()
checkTokenExchangeState()
```

---

### Scenario 4: After Token Exchange (Fix Broken)
**Location**: `/v8u/unified/oauth-authz/4`  
**Expected**:
- Unit tests: ✅ All pass (logic is correct)
- Integration tests: ❌ Some fail (DOM not updated)
- Diagnostic: "FIX NOT WORKING"

**What to check**:
1. Is success message visible?
2. Is exchange button hidden?
3. Are tokens in sessionStorage?

---

## 🔍 Debugging Commands

### Check Storage
```javascript
// Check PKCE codes
sessionStorage.getItem('v8u_flow_oauth-authz-v8u_pkce')

// Check tokens
sessionStorage.getItem('v8u_flow_oauth-authz-v8u_tokens')

// Check callback data
sessionStorage.getItem('v8u_flow_oauth-authz-v8u_callback')
```

### Check DOM Elements
```javascript
// Find success message
document.querySelectorAll('div')
  .forEach(div => {
    if (div.textContent?.includes('Tokens already exchanged')) {
      console.log('Found success message:', div)
    }
  })

// Find exchange button
document.querySelectorAll('button')
  .forEach(btn => {
    if (btn.textContent?.includes('Exchange Code')) {
      console.log('Found exchange button:', btn)
    }
  })
```

### Get Detailed Test Results
```javascript
// Unit test details
const unitResults = runTokenExchangeTests()
unitResults.forEach(r => {
  console.log(`${r.testName}: ${r.passed ? 'PASS' : 'FAIL'}`)
  if (!r.passed) console.log('Details:', r.details)
})

// Integration test details
const integrationResults = await runIntegrationTests()
integrationResults.forEach(r => {
  console.log(`${r.testName}: ${r.passed ? 'PASS' : 'FAIL'}`)
  if (r.domState) console.log('DOM State:', r.domState)
})
```

---

## 📊 Understanding Test Results

### ✅ Pass
Test validated successfully. Feature is working as expected.

### ❌ Fail
Test failed. Feature is not working correctly. Check details for more info.

### ⏭️ Skip
Test skipped because prerequisites not met (e.g., haven't completed OAuth flow yet).

---

## 🎓 Test Coverage

### Unit Tests (10 tests)
1. Initial State
2. After Callback
3. During Exchange
4. After Successful Exchange
5. **Reuse Attempt Prevention** ⭐
6. Error Handling
7. PKCE Validation
8. Credentials Validation
9. UI State Transitions
10. Storage Persistence

### Integration Tests (6 tests)
1. **Success Message Display** ⭐
2. **Button Hidden After Success** ⭐
3. **Error Hidden After Success** ⭐
4. PKCE Storage Persistence
5. Token Storage
6. Step Indicator

---

## 💡 Tips

1. **Run diagnostic first**: `checkTokenExchangeState()` gives you instant feedback
2. **Unit tests always work**: They test logic, not DOM
3. **Integration tests need flow**: Complete OAuth flow to test DOM behavior
4. **Check console logs**: Tests provide detailed logging
5. **Use table view**: `console.table(results)` for better readability

---

## 🆘 Troubleshooting

### "Tests not found"
**Solution**: Refresh the page. Tests load on app startup.

### "All tests skipped"
**Solution**: Navigate to `/v8u/unified/oauth-authz` and complete the flow.

### "Tests failing after token exchange"
**Solution**: This means the fix is broken. Check:
1. Is `flowState.tokens?.accessToken` set?
2. Is the conditional rendering correct?
3. Are there any console errors?

### "Can't see success message"
**Solution**: Run `checkTokenExchangeState()` to see what's in the DOM.

---

**Quick Start**: `checkTokenExchangeState()` → `runTokenExchangeTests()` → `await runIntegrationTests()`
