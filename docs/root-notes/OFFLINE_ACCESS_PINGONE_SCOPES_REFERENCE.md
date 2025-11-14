# offline_access Added to PingOne Scopes Reference ✅

**Date:** 2025-11-11  
**File Modified:** `src/pages/docs/PingOneScopesReference.tsx`  
**URL:** `https://localhost:3000/pingone-scopes-reference`  
**Status:** Complete

---

## What Was Added

Added comprehensive `offline_access` scope documentation to the **Standard OpenID Connect Scopes** section (Section 1) of the PingOne Scopes Reference page.

---

## Location

**Section:** 1. Standard OpenID Connect Scopes  
**Position:** After the `phone` scope  
**Highlighted:** Yellow background to draw attention

---

## Content Added

### 1. Scope Table Row

**Scope Column:**
- `offline_access` code badge
- "REFRESH TOKEN" pill badge (red/critical variant)

**Grants Column:**
- **Bold heading:** "Enables refresh token issuance"
- Clear explanation of what it does
- **PingOne Behavior** subsection with bullet points:
  - Returns refresh token in token response
  - Supports refresh token rotation (recommended)
  - Configurable token lifetime (default: 30 days)
  - Idle timeout configuration
  - Token revocation capabilities

**Usage Tips Column:**
- **✅ Use for:** (with bullet list)
  - Mobile applications
  - Background sync services
  - Long-running desktop apps
  - Scheduled tasks requiring user context

- **❌ Avoid for:** (with bullet list)
  - Browser-based SPAs (unless using BFF pattern)
  - Short-lived sessions
  - Public clients without secure storage

- **🔒 Security:** Best practices summary
  - Secure storage requirements
  - Platform-specific recommendations
  - Token rotation importance

### 2. Security Callout Box

Added a prominent warning callout below the table with:

**Title:** "offline_access Security Best Practices"

**5 Key Best Practices:**
1. **Enable Token Rotation** - Issue new refresh token with each use
2. **Secure Storage** - Platform-specific secure storage (Keychain, Keystore, BFF)
3. **Handle Revocation** - Proper error handling and re-authentication
4. **Monitor Usage** - Track patterns to detect anomalies
5. **Set Appropriate Lifetimes** - Balance security and user experience

---

## Visual Design

### Highlighting
- **Yellow background** (#fef3c7) on the table row to make it stand out
- **Red "REFRESH TOKEN" pill** to indicate special scope type
- **Warning callout** (yellow) with shield icon for security practices

### Icons
- 🔒 Security emoji for security tips
- ✅ Checkmark for recommended uses
- ❌ X mark for things to avoid
- Shield icon in callout box

### Formatting
- Bold headings for sections
- Bullet lists for easy scanning
- Inline code formatting for technical terms
- Proper spacing and margins

---

## Key Information Provided

### What Users Learn:
1. **What offline_access does** - Enables refresh tokens
2. **How PingOne handles it** - Rotation, lifetimes, revocation
3. **When to use it** - Mobile apps, background services
4. **When NOT to use it** - SPAs, short sessions
5. **How to secure it** - Storage, rotation, monitoring
6. **PingOne-specific features** - 30-day default, rotation support

---

## Comparison: Two Pages Updated

### Page 1: Scopes Best Practices (`/docs/scopes-best-practices`)
- **Focus:** Educational, detailed explanation
- **Content:** Flow diagrams, code examples, configuration tables
- **Audience:** Developers implementing offline_access

### Page 2: PingOne Scopes Reference (`/pingone-scopes-reference`) ✅ THIS ONE
- **Focus:** Quick reference, at-a-glance information
- **Content:** Table format, concise tips, security highlights
- **Audience:** Developers choosing which scopes to use

---

## Benefits

### Quick Reference
- ✅ Developers can quickly see offline_access in the standard scopes table
- ✅ Highlighted row draws attention to this important scope
- ✅ All key information in one place

### Security Awareness
- ✅ Prominent security callout ensures developers see best practices
- ✅ Clear warnings about when NOT to use it
- ✅ Platform-specific storage recommendations

### PingOne-Specific
- ✅ Shows PingOne's specific behavior (rotation, lifetimes)
- ✅ Highlights PingOne features (admin console revocation)
- ✅ Provides PingOne defaults (30-day lifetime)

---

## Testing

Access the page at: `https://localhost:3000/pingone-scopes-reference`

**Verify:**
- [x] offline_access row appears in Section 1 table
- [x] Yellow highlighting is visible
- [x] "REFRESH TOKEN" pill badge displays
- [x] PingOne Behavior bullet points are formatted correctly
- [x] Use/Avoid lists are clear
- [x] Security callout box appears below table
- [x] All formatting is consistent with page style
- [x] No TypeScript errors
- [x] No console errors

---

## Summary

Successfully added comprehensive `offline_access` scope documentation to the PingOne Scopes Reference page, including:
- ✅ Detailed scope description in the Standard OIDC Scopes table
- ✅ PingOne-specific behavior and features
- ✅ Clear use cases and anti-patterns
- ✅ Security best practices callout
- ✅ Visual highlighting to draw attention

The information is now available on the page you're viewing: `https://localhost:3000/pingone-scopes-reference`
