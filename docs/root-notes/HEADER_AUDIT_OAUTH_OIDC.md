# Header Color & Icon Audit - OAuth & OIDC Authorization Flows

## Standards Reference
- 🟠 ORANGE (theme='orange') + FiSettings → Configuration & Credentials
- 🔵 BLUE (theme='blue') + FiSend → Flow execution steps & request actions
- 🟡 YELLOW (theme='yellow') + FiBook → Educational (1st, 3rd, 5th...)
- 🟢 GREEN (theme='green') + FiBook/FiCheckCircle → Educational (2nd, 4th, 6th...) & success
- 💙 HIGHLIGHT (theme='highlight') + FiPackage → Results, responses, tokens

## OAuth Authorization Code Flow - Headers to Update

### Step 0 (Configuration)
1. ✅ "OAuth 2.0 Authorization Code Overview" - FiBook - **Needs: YELLOW theme**
2. ✅ "Application Configuration & Credentials" - FiSettings - **Correct: ORANGE** (via ComprehensiveCredentialsService)
3. ✅ "Advanced OAuth Parameters" - FiSettings - **Needs: ORANGE theme**
4. ❌ "Saved Configuration Summary" - FiCheckCircle - **Needs: GREEN theme + keep FiCheckCircle**

### Step 1 (PKCE Generation)
5. ❌ "What is PKCE?" - FiShield - **Needs: GREEN theme + change to FiBook** (2nd educational)
6. ❌ "Understanding Code Verifier & Code Challenge" - FiKey - **Needs: YELLOW theme + change to FiBook** (3rd educational)

### Step 2 (Build Auth URL)
7. ❌ "Understanding Authorization Requests" - FiGlobe - **Needs: GREEN theme + change to FiBook** (4th educational)
8. ❌ "Authorization URL Parameters Deep Dive" - FiKey - **Needs: YELLOW theme + change to FiBook** (5th educational)
9. ❌ "Build Your Authorization URL" (ResultsHeading, not header) - **Needs: BLUE theme + FiSend**

### Step 3 (Authorization Code Received)
10. ❌ "Authorization Response Overview" - FiCheckCircle - **Needs: GREEN theme + keep FiCheckCircle** (6th educational/success)
11. ❌ "Authorization Code Details" - FiKey - **Needs: HIGHLIGHT theme + change to FiPackage**
12. ❌ "Authorization Code Received" (ResultsHeading) - **Needs: HIGHLIGHT theme + FiPackage**

### Step 4 (Token Exchange)
13. ❌ "Token Exchange Overview" - FiKey - **Needs: GREEN theme + change to FiBook** (7th educational, but could be yellow... let's say green)
14. ❌ "Token Exchange Details" - FiRefreshCw - **Needs: BLUE theme + change to FiSend**

## OIDC Authorization Code Flow - Same Issues

Both flows use local styled components instead of CollapsibleHeader service, so colors aren't applied.

## Fix Strategy

Since these flows use local `CollapsibleHeaderButton` styled components, we need to:
1. Create theme-specific variants (OrangeHeader, BlueHeader, YellowHeader, GreenHeader, HighlightHeader)
2. Update each header to use the correct variant
3. Update icons to match standards

We cannot easily use the CollapsibleHeader service here because these flows have custom styling and structure.
