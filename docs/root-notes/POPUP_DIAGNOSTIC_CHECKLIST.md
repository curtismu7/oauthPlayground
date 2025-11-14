# Popup Diagnostic Checklist - Step by Step

## 🎯 **Goal**
Find out WHY the callback isn't working even though there's no redirect URI error.

---

## 📋 **Step-by-Step Diagnostic**

### **Step 1: Open Dev Tools for POPUP Window**

1. Click "Redirect to PingOne" button
2. Popup window opens
3. **IMMEDIATELY right-click INSIDE the popup window**
4. Select "Inspect" or press **F12** (while popup is focused)
5. Go to the **Console** tab
6. **Keep this console open!**
7. Now authenticate with PingOne

### **Step 2: After Authentication - Check Popup URL**

After you complete authentication in PingOne, look at the **URL bar in the popup**:

**✅ If you see this URL:**
```
https://localhost:3000/authz-callback?code=XXXXXXXX&state=YYYYYYYY
```
→ **GOOD!** PingOne redirected correctly. Go to Step 3.

**❌ If you see this URL:**
```
https://auth.pingone.com/...
```
→ **BAD!** PingOne is NOT redirecting back. This means:
- Redirect URI is not whitelisted in PingOne (even though no error shows)
- OR PingOne session/authentication is failing
- See "Fix A" below

**❌ If you see a different localhost URL:**
```
https://localhost:3000/something-else
```
→ PingOne is redirecting to the wrong URI. See "Fix B" below.

---

### **Step 3: Check Popup Console Logs**

If the popup IS on `/authz-callback`, you should see these logs **immediately**:

```
🔄 [AuthCallback] ===== STARTING CALLBACK PROCESSING =====
🔄 [AuthCallback] Current URL: https://localhost:3000/authz-callback?code=...
🔄 [AuthCallback] ===== URL PARAMETER ANALYSIS =====
🔄 [AuthCallback] Code parameter: XXXXXXXXXX...
🔄 [AuthCallback] State parameter: YYYYYY
```

**✅ If you see these logs:**
→ Callback page is loading! Go to Step 4.

**❌ If you DON'T see these logs:**
→ The callback page component isn't loading. See "Fix C" below.

---

### **Step 4: Check for "SUCCESSFUL AUTHORIZATION" Log**

Look for this specific log in the popup console:

```
✅ [AuthCallback] ===== SUCCESSFUL AUTHORIZATION DETECTED =====
✅ [AuthCallback] Authorization code received: XXXXXXXXXX...
```

**✅ If you see this:**
→ Code detected! Go to Step 5.

**❌ If you DON'T see this:**
→ No code parameter in URL. See "Fix D" below.

---

### **Step 5: Check for "Triggering custom event" Log**

Look for this:

```
✅ [AuthCallback] Triggering custom event in parent window...
```

**✅ If you see this:**
→ Event dispatched! Go to Step 6.

**❌ If you DON'T see this:**
→ Event not dispatched. Check for errors in popup console. See "Fix E" below.

---

### **Step 6: Check Main Window Console**

Now switch to the **main window** (not popup) console and look for:

```
🎉 [useAuthorizationCodeFlowController] ===== POPUP CALLBACK EVENT RECEIVED =====
✅ [useAuthorizationCodeFlowController] Setting auth code from popup: XXXXXXXXXX...
```

**✅ If you see this:**
→ Event received! The flow should work. If it doesn't, see "Fix F" below.

**❌ If you DON'T see this:**
→ Event was dispatched but not received. See "Fix G" below.

---

## 🔧 **Fixes**

### **Fix A: PingOne Not Redirecting (No Error)**

**Problem:** Popup stays on `https://auth.pingone.com/...` after authentication

**Causes:**
1. Redirect URI is not in PingOne's whitelist (even though no error shows)
2. Multiple applications in PingOne - authenticating with wrong one
3. PingOne session issue

**Solution:**

1. **Double-check PingOne client configuration:**
   - Environment: `b9817c16-9910-4415-b67e-4ac687da74d9`
   - Client ID: `a4f963ea-0736-456a-be72-b1fa4f63f81f`
   - Verify this is the CORRECT application
   - Check "Redirect URIs" field contains: `https://localhost:3000/authz-callback`

2. **Try copying the redirect URI from PingOne:**
   - What's actually listed in PingOne?
   - Copy it EXACTLY and use it in the app

3. **Check if there are multiple apps:**
   - Are you authenticating with the right one?
   - Client ID in URL should match your app's client ID

---

### **Fix B: Redirecting to Wrong URL**

**Problem:** Popup redirects to a different URL (not `/authz-callback`)

**Solution:**
- Check what URL PingOne is redirecting to
- Update your app's redirect URI to match
- OR update PingOne to redirect to `/authz-callback`

---

### **Fix C: Callback Page Not Loading**

**Problem:** Popup is on `/authz-callback` but no logs appear

**Possible Causes:**
1. React Router not configured for `/authz-callback`
2. JavaScript error preventing component from loading
3. Build issue

**Solution:**

1. **Check for JavaScript errors:**
   - Look for RED errors in popup console
   - Screenshot and share them

2. **Check React Router:**
   ```typescript
   // Should have a route like:
   <Route path="/authz-callback" element={<AuthorizationCallback />} />
   ```

3. **Try direct navigation:**
   - In main window, go to: `https://localhost:3000/authz-callback?code=TEST&state=TEST`
   - Do you see the callback page?
   - If not, routing is broken

---

### **Fix D: No Code Parameter**

**Problem:** Callback page loads but sees no `code` parameter

**Possible Causes:**
1. PingOne authentication failed (error in URL instead)
2. URL parameters lost during redirect
3. Wrong response_type

**Solution:**

1. **Check for error parameters:**
   - Look in popup URL for `?error=...`
   - Check popup console for error logs

2. **Check URL manually:**
   - What EXACTLY is in the popup URL bar?
   - Copy and paste it here

3. **Verify OAuth configuration:**
   - Response type should be `code`
   - Grant type should be `authorization_code`

---

### **Fix E: Event Not Dispatched**

**Problem:** Code detected but event not dispatched

**Possible Causes:**
1. `window.opener` is null or closed
2. Error when trying to access parent window
3. Cross-origin issue

**Solution:**

1. **Check window.opener:**
   In popup console, run:
   ```javascript
   console.log('window.opener:', window.opener);
   console.log('opener closed?', window.opener?.closed);
   ```

2. **Check for errors:**
   - Look for red errors in popup console
   - Especially "Cannot read property" or "blocked by CORS"

---

### **Fix F: Event Received But Flow Doesn't Advance**

**Problem:** All logs look good but flow doesn't advance to Step 4

**Solution:**

1. **Check React state update:**
   In main window console, run:
   ```javascript
   sessionStorage.getItem('oauth-authorization-code-v6-current-step')
   ```
   Should return `'4'`

2. **Check for stale auth code:**
   ```javascript
   sessionStorage.getItem('oauth-authorization-code-v6-authCode')
   ```
   Should have a code

3. **Force refresh:**
   - Refresh the main window page
   - Check if it loads on Step 4

---

### **Fix G: Event Dispatched But Not Received**

**Problem:** Popup dispatches event but main window doesn't catch it

**Possible Causes:**
1. Event listener not registered (removed before event arrives)
2. Main window/tab has reloaded
3. Timing issue

**Solution:**

1. **Check listener registration:**
   In main window console, look for:
   ```
   🎧 [useAuthorizationCodeFlowController] Event listener registered
   ```

2. **Check if listener was removed:**
   Look for:
   ```
   🔌 [useAuthorizationCodeFlowController] Removing auth-code-received listener
   ```
   If this appears RIGHT BEFORE the popup callback, that's the problem!

3. **Test event manually:**
   In main window console, run:
   ```javascript
   window.dispatchEvent(new CustomEvent('auth-code-received', {
     detail: { code: 'TEST123', state: 'test', timestamp: Date.now() }
   }));
   ```
   Does it trigger the logs?

---

## 📸 **What to Share**

If none of these fixes work, please share:

1. **Screenshot of popup URL** after authentication
2. **All console logs from popup** (copy/paste entire console)
3. **All console logs from main window** around the time you clicked Continue
4. **PingOne client configuration:**
   - What redirect URIs are listed?
   - What grant types are enabled?
   - What response types are enabled?

---

## 🎯 **Most Common Issues**

**90% of the time it's one of these:**

1. ❌ **Popup never reaches `/authz-callback`** → Redirect URI not in PingOne
2. ❌ **Popup reaches callback but no logs** → React Router issue or JS error
3. ❌ **Event dispatched but not received** → Event listener timing issue
4. ❌ **`window.opener` is null** → Popup lost reference to parent

Let's find out which one it is! 🔍

