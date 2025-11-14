# Code Generator - Quick Test Guide

## 🚀 How to Test Right Now

### Step 1: Start the App
```bash
npm run dev
```

### Step 2: Navigate to Kroger MFA Flow
Open in browser:
```
https://localhost:3000/flows/kroger-grocery-store-mfa
```

### Step 3: Find the Code Generator
Scroll down to the collapsible section:
**"Code Examples - Production Ready"**

### Step 4: Test the Features

#### Test 1: Category Switching ✅
1. Click "Category" dropdown
2. Select "Frontend" → See 3 options (Ping SDK, Fetch, Axios)
3. Select "Backend" → See 2 options (Node.js, Python)
4. Watch code update instantly

#### Test 2: Code Type Switching ✅
**Frontend Options:**
- Ping SDK (JavaScript) → Uses @pingidentity/pingone-js-sdk
- REST API (Fetch) → Native browser Fetch API
- REST API (Axios) → Axios HTTP client

**Backend Options:**
- Ping SDK (Node.js) → Express.js server
- Python (Requests) → Flask server

#### Test 3: Flow Steps ✅
Click through all 6 tabs at the top:
1. **Authorization** → OAuth 2.0 + PKCE flow
2. **Worker Token** → Client credentials grant
3. **Device Selection** → List MFA devices
4. **MFA Challenge** → Send OTP code
5. **MFA Verification** → Verify OTP code
6. **Device Registration** → Register new device

Each tab shows different code for that step.

#### Test 4: Configuration Injection ✅
1. Update "Environment ID" → Code updates with new value
2. Update "Client ID" → Code updates
3. Update "Redirect URI" → Code updates
4. Update "User ID" → Code updates

All placeholders in code are replaced instantly!

#### Test 5: Code Actions ✅
- **Copy Code** → Copies to clipboard (shows toast)
- **Download** → Downloads file with correct extension (.ts, .js, .py)
- **Format** → Formats code with Monaco formatter
- **Reset** → Resets to original template
- **Theme Toggle** → Switch between light/dark mode

#### Test 6: Language Selector ✅
Try changing the language dropdown:
- JavaScript
- TypeScript
- Python
- Go
- Ruby
- etc.

(Note: Code content doesn't change yet, but syntax highlighting does)

## 🎯 What to Look For

### ✅ Expected Behavior
- Code updates instantly when switching categories
- Code updates instantly when switching types
- Code updates instantly when switching flow steps
- Configuration values inject into code
- Copy/download/format buttons work
- No console errors
- Smooth transitions
- Toast notifications appear

### ❌ Issues to Report
- Code doesn't update when switching
- Configuration values don't inject
- Copy/download doesn't work
- Console errors appear
- UI freezes or lags
- Missing code samples

## 📊 Test Matrix

| Category | Code Type | Steps | Status |
|----------|-----------|-------|--------|
| Frontend | Ping SDK JS | 1-6 | ✅ Ready |
| Frontend | REST API (Fetch) | 1-6 | ✅ Ready |
| Frontend | REST API (Axios) | 1-6 | ✅ Ready |
| Backend | Node.js | 1-6 | ✅ Ready |
| Backend | Python | 1-6 | ✅ Ready |

**Total: 30 code samples ready to test**

## 🔍 Detailed Test Cases

### Test Case 1: Frontend Ping SDK
1. Select "Frontend" category
2. Select "Ping SDK (JavaScript)"
3. Click "1. Authorization" tab
4. Verify code shows:
   - `import { PingOneClient }`
   - `new PingOneClient({ ... })`
   - PKCE implementation
   - `window.location.href = authUrl`
5. Click "2. Worker Token" tab
6. Verify code shows client credentials flow
7. Continue through all 6 steps

### Test Case 2: Frontend REST API (Fetch)
1. Select "Frontend" category
2. Select "REST API (Fetch)"
3. Click "1. Authorization" tab
4. Verify code shows:
   - Manual PKCE generation
   - `crypto.subtle.digest('SHA-256')`
   - `fetch()` calls
   - No external dependencies
5. Test all 6 steps

### Test Case 3: Frontend REST API (Axios)
1. Select "Frontend" category
2. Select "REST API (Axios)"
3. Click "1. Authorization" tab
4. Verify code shows:
   - `import axios from 'axios'`
   - `axios.post()` calls
   - Axios error handling
5. Check dependencies show "axios"
6. Test all 6 steps

### Test Case 4: Backend Node.js
1. Select "Backend" category
2. Select "Ping SDK (Node.js)"
3. Click "1. Authorization" tab
4. Verify code shows:
   - `const express = require('express')`
   - Express routes
   - Session management
   - `app.listen(3000)`
5. Check dependencies show "express, express-session, node-fetch"
6. Test all 6 steps

### Test Case 5: Backend Python
1. Select "Backend" category
2. Select "Python (Requests)"
3. Click "1. Authorization" tab
4. Verify code shows:
   - `from flask import Flask`
   - Flask routes
   - `requests.post()`
   - Python syntax
5. Check dependencies show "flask, requests"
6. Test all 6 steps

### Test Case 6: Configuration Injection
1. Select any category/type
2. Update "Environment ID" to "test-env-123"
3. Verify code shows "test-env-123" in all places
4. Update "Client ID" to "test-client-456"
5. Verify code shows "test-client-456"
6. Switch to different flow step
7. Verify new values persist

### Test Case 7: Copy Functionality
1. Select any code sample
2. Click "Copy Code" button
3. Verify toast shows "Code copied to clipboard!"
4. Paste into text editor
5. Verify code is complete and correct

### Test Case 8: Download Functionality
1. Select "Frontend" → "Ping SDK (JavaScript)"
2. Click "1. Authorization" tab
3. Click "Download" button
4. Verify file downloads as `mfa-1.-authorization.ts`
5. Open file and verify content matches editor
6. Select "Backend" → "Python"
7. Click "Download" button
8. Verify file downloads as `.py` extension

## 🐛 Known Limitations

### Not Yet Implemented
- ❌ React components (shows placeholder)
- ❌ Angular services (shows placeholder)
- ❌ Vue.js (shows placeholder)
- ❌ Next.js (shows placeholder)
- ❌ Mobile platforms (shows placeholder)
- ❌ Go, Ruby, C#, Java (shows placeholder)

### Placeholders Show
```typescript
// frontend - react - authorization
// 
// This code template is coming soon!
```

This is expected for code types not yet implemented.

## 📝 Test Checklist

- [ ] App starts without errors
- [ ] Navigate to Kroger MFA flow
- [ ] Code generator section visible
- [ ] Can expand/collapse section
- [ ] Category dropdown works
- [ ] Code type dropdown works
- [ ] All 6 flow tabs work
- [ ] Configuration fields update code
- [ ] Copy button works
- [ ] Download button works
- [ ] Format button works
- [ ] Reset button works
- [ ] Theme toggle works
- [ ] No console errors
- [ ] Toast notifications appear
- [ ] Code syntax highlighting works
- [ ] Dependencies list shows correctly
- [ ] Description updates per step
- [ ] Status bar shows correct info

## 🎉 Success Criteria

### MVP is successful if:
- ✅ All 30 code samples display correctly
- ✅ Category/type switching works smoothly
- ✅ Flow step tabs work correctly
- ✅ Configuration injection works
- ✅ Copy/download functionality works
- ✅ No TypeScript errors
- ✅ No runtime errors
- ✅ UI is responsive and smooth

## 📞 Reporting Issues

If you find issues, note:
1. Which category/type/step
2. What you expected
3. What actually happened
4. Any console errors
5. Browser and version

## 🚀 Next Steps After Testing

Once MVP is validated:
1. Add React component templates
2. Add Angular service templates
3. Add Vue.js composable templates
4. Add mobile platform templates
5. Add more backend languages
6. Add code caching
7. Add code validation
8. Add "Run in CodeSandbox" feature

---

**Ready to test!** 🎯

Start the dev server and navigate to the Kroger MFA flow to see the code generator in action.
