# Resource Indicators & Claims Enhancements Plan

## Issues to Fix

### 1. Claim Names Verification
**Question:** Do these claim names match PingOne?
- email, email_verified, given_name, family_name, name, nickname, picture
- phone_number, phone_number_verified, address, birthdate, gender
- locale, zoneinfo, updated_at

**Answer:** ✅ YES - These are standard OIDC claims defined in the OpenID Connect Core specification.
PingOne is OIDC-compliant and supports all standard OIDC claims.

**Reference:** https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims

---

### 2. "Add Claim" Button Doesn't Look Like a Button
**Issue:** Dashed border style isn't clearly a button - needs better visual styling and directions

**Solution:**
- Make it look more like an action button (solid border, button-like styling)
- Add helper text/directions above the button
- Add icon for visual clarity

---

### 3. Resource Indicators - Add Drag & Drop
**Issue:** Resource Indicators needs same drag/drop functionality as Audience Parameter

**Solution:**
- Add drag handlers to example items
- Add drop zone on input field
- Visual feedback (grab cursor, move icon)
- Animate on hover

---

### 4. Add PingOne Base URL as Example
**Issue:** Need to show PingOne issuer URL with environment ID as an example

**Solution:**
- Pass issuer/environmentId props to ResourceParameterInput
- Show PingOne URL as first blue example (like Audience)
- Add "OIDC" or "PingOne" badge
- Format: `https://auth.pingone.com/{environmentId}`

---

## Implementation Steps

1. Update ResourceParameterInput.tsx
   - Add issuer/environmentId props
   - Add drag & drop handlers
   - Add PingOne example at top
   - Style discovered examples with blue background
   
2. Update ClaimsRequestBuilder.tsx
   - Redesign "Add Claim" button to look more like a button
   - Add helper text above button
   - Make it more prominent

3. Update OAuthAuthorizationCodeFlowV6.tsx
   - Pass issuer/environmentId to ResourceParameterInput

4. Update OIDCAuthorizationCodeFlowV6.tsx
   - Pass issuer/environmentId to ResourceParameterInput
