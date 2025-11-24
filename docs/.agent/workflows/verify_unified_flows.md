---
description: Verify all OAuth/OIDC flows in the Unified App (V8U)
---

# Unified App Flow Verification Workflow

This workflow guides you through verifying that all OAuth and OIDC flows are working correctly in the Unified App (V8U).

## Prerequisites

1.  Ensure the development server is running:
    ```bash
    npm run dev
    ```
2.  Open the application in your browser: `https://localhost:3000`
    -   **Note:** You may need to bypass the self-signed certificate warning (Advanced -> Proceed to localhost).
3.  Navigate to the Unified Flow page:
    -   Click "V8 Flows (Latest)" in the sidebar.
    -   Click "🎯 Unified Flow (V8U)".

---

## Test Case 1: Client Credentials Flow

1.  **Select Spec Version:** `OAuth 2.0`
2.  **Select Flow Type:** `Client Credentials`
3.  **Enter Credentials:**
    -   **Client ID:** `a4f963ea-0736-456a-be72-b1fa4f63f81f`
    -   **Client Secret:** `0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a`
    -   **Environment ID:** `b9817c16-9910-4415-b67e-4ac687da74d9`
4.  **Execute:**
    -   Click "Next".
    -   Click "Get Token".
5.  **Verify:**
    -   [ ] A token request is made to the token endpoint.
    -   [ ] An Access Token is displayed.
    -   [ ] The token is decoded and details are shown.

---

## Test Case 2: Resource Owner Password Credentials (ROPC)

1.  **Select Spec Version:** `OAuth 2.0`
2.  **Select Flow Type:** `Resource Owner Password Credentials`
3.  **Enter Credentials:**
    -   **Client ID:** `a4f963ea-0736-456a-be72-b1fa4f63f81f`
    -   **Environment ID:** `b9817c16-9910-4415-b67e-4ac687da74d9`
4.  **Execute:**
    -   Click "Next".
    -   Enter a valid **Username** and **Password** for a test user in this environment.
    -   Click "Get Token".
5.  **Verify:**
    -   [ ] A token request is made.
    -   [ ] An Access Token (and ID Token if OIDC) is displayed.

---

## Test Case 3: Device Authorization Flow

1.  **Select Spec Version:** `OAuth 2.0` or `OAuth 2.1`
2.  **Select Flow Type:** `Device Authorization Flow`
3.  **Enter Credentials:**
    -   **Client ID:** `a4f963ea-0736-456a-be72-b1fa4f63f81f`
    -   **Environment ID:** `b9817c16-9910-4415-b67e-4ac687da74d9`
4.  **Execute:**
    -   Click "Next".
    -   Click "Start Device Authorization".
5.  **Verify:**
    -   [ ] A User Code and Verification URI are displayed.
    -   [ ] A QR code may be displayed (if implemented).
    -   [ ] The app starts polling for tokens.
    -   **Action:** Open the Verification URI in a new tab and enter the User Code.
    -   [ ] After approval, the app automatically receives and displays the tokens.

---

## Test Case 4: Authorization Code Flow

1.  **Select Spec Version:** `OAuth 2.0` or `OAuth 2.1`
2.  **Select Flow Type:** `Authorization Code`
3.  **Enter Credentials:**
    -   **Client ID:** `a4f963ea-0736-456a-be72-b1fa4f63f81f`
    -   **Client Secret:** `0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a`
    -   **Environment ID:** `b9817c16-9910-4415-b67e-4ac687da74d9`
    -   **Redirect URI:** `https://localhost:3000/unified-callback`
4.  **Execute:**
    -   Click "Next".
    -   Click "Authorize".
5.  **Verify:**
    -   [ ] You are redirected to the PingOne login page.
    -   [ ] After login, you are redirected back to the app.
    -   [ ] The app exchanges the code for tokens.
    -   [ ] Access Token and ID Token are displayed.

---

## Test Case 5: Hybrid Flow

1.  **Select Spec Version:** `OpenID Connect`
2.  **Select Flow Type:** `Hybrid Flow`
3.  **Enter Credentials:**
    -   **Client ID:** `a4f963ea-0736-456a-be72-b1fa4f63f81f`
    -   **Client Secret:** `0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a`
    -   **Environment ID:** `b9817c16-9910-4415-b67e-4ac687da74d9`
    -   **Redirect URI:** `https://localhost:3000/unified-callback`
4.  **Execute:**
    -   Click "Next".
    -   Click "Authorize".
5.  **Verify:**
    -   [ ] You are redirected to the PingOne login page.
    -   [ ] After login, you are redirected back to the app.
    -   [ ] The URL fragment contains `code` and `id_token`.
    -   [ ] The app parses the fragment and exchanges the code.
    -   [ ] Access Token and ID Token are displayed.

---

## Test Case 6: Compliance Enforcement (OAuth 2.1)

1.  **Select Spec Version:** `OAuth 2.1`
2.  **Verify Restrictions:**
    -   [ ] `Implicit Flow` is NOT available in the dropdown.
    -   [ ] `Resource Owner Password Credentials` is NOT available in the dropdown.
3.  **Select Flow Type:** `Authorization Code`
4.  **Verify PKCE:**
    -   [ ] PKCE is automatically enabled and cannot be disabled.

---

## Reporting Issues

If any of the above tests fail, please document:
1.  The exact steps taken.
2.  The error message displayed (if any).
3.  Any console errors (F12 > Console).
