# V8 Utility - All Token Apps UI Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Utility Type:** Token Management & Clearing Utility

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Token Management Page](#token-management-page)
4. [Clearing All Tokens](#clearing-all-tokens)
5. [Understanding Token Analysis](#understanding-token-analysis)
6. [Token History](#token-history)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Overview

The **All Token Apps** utility refers to the comprehensive token management and clearing functionality in the OAuth Playground. This includes viewing, analyzing, and managing OAuth/OIDC tokens, as well as clearing all tokens from browser storage.

### Key Characteristics

- ✅ **Token Management**: View, analyze, and manage OAuth/OIDC tokens
- ✅ **Token Clearing**: Clear all tokens from browser storage with one action
- ✅ **Token History**: Track tokens from previous OAuth flows
- ✅ **Token Analysis**: Analyze token security, validity, and structure
- ✅ **Multiple Storage Support**: Clears tokens from localStorage and sessionStorage

### When to Use

- **Viewing Tokens**: View tokens obtained from OAuth flows
- **Analyzing Tokens**: Analyze token security and validity
- **Clearing Tokens**: Clear all tokens before switching environments or sharing browser
- **Token History**: Review tokens from previous flows
- **Security Cleanup**: Clear tokens for security purposes

### Prerequisites

- **OAuth Flow Completion**: Complete an OAuth flow to obtain tokens (optional)
- **Browser Storage**: Browser must support localStorage and sessionStorage
- **No Special Permissions**: No special permissions required

---

## Getting Started

### Accessing Token Management

1. Navigate to the Token Management page: `/token-management`
2. The page will automatically load tokens from storage (if available)
3. You can also manually enter tokens or load from history

### Accessing Token Clearing

**From Token Management Page**:
1. Navigate to Token Management page
2. Click "Clear All Tokens" button
3. Confirm the action

**From Application Generator**:
1. Navigate to Application Generator page
2. Tokens are automatically cleared on page load

**Programmatically**:
- Use `clearAllTokens()` function in code
- Available in `src/utils/tokenCleaner.ts`

---

## Token Management Page

### Overview

The Token Management page provides a comprehensive interface for viewing, analyzing, and managing OAuth/OIDC tokens.

### Main Sections

1. **Token Input Section**: Enter or load tokens
2. **Token Analysis Section**: Analyze token security and validity
3. **Token History Section**: View token history
4. **Token Actions Section**: Clear, revoke, or manage tokens

---

### Section 1: Token Input

**Purpose**: Enter or load OAuth/OIDC tokens for analysis.

#### Input Methods

**1. Manual Entry**:
- Paste token directly into the token input field
- Token format: JWT (JSON Web Token)
- Example: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`

**2. Load from Storage**:
- Click "Load from Storage" button
- Automatically loads tokens from browser storage
- Loads most recent token from `localStorage` or `sessionStorage`

**3. Load from History**:
- Click on a history entry
- Loads token from token history
- Shows token source and timestamp

**4. Auto-load from Flow**:
- Tokens are automatically loaded when navigating from OAuth flows
- Flow name and timestamp are tracked
- Token source is displayed

#### Token Input Field

**Field Type**: Multi-line text area

**Validation**:
- Must be valid JWT format
- Structure: `header.payload.signature`
- Auto-detects token type

**What Happens**:
- Token is automatically decoded
- Header and payload are displayed
- Token analysis begins automatically

#### Token Source Display

**Information Shown**:
- **Source**: Flow name (e.g., "Authorization Code Flow")
- **Description**: Token description
- **Timestamp**: When token was obtained

**Display Format**:
- Source badge
- Description text
- Timestamp

---

### Section 2: Token Analysis

**Purpose**: Analyze token security, validity, and structure.

#### Analysis Features

**1. Token Decoding**:
- Decodes JWT header and payload
- Displays JSON structure
- Shows token claims

**2. Security Score**:
- Calculates security score (0-100)
- Color-coded display:
  - **90-100**: Excellent (green)
  - **70-89**: Good (yellow)
  - **50-69**: Fair (orange)
  - **0-49**: Poor (red)

**3. Expiration Status**:
- Checks if token is expired
- Shows expiration time
- Warns if expiring soon

**4. Critical Issues**:
- Identifies security issues
- Examples:
  - No signature algorithm
  - Expired token
  - Weak nonce
  - Missing required claims

**5. Validation Errors**:
- Checks token validity
- Shows validation errors
- Highlights issues

**6. Token Type Detection**:
- Detects token type
- Shows type badge:
  - Access Token
  - ID Token
  - Refresh Token

#### Understanding Security Score

**Score Calculation**:
- Based on token structure
- Security best practices
- Claim validation
- Algorithm strength

**What Affects Score**:
- ✅ Strong signature algorithm (high score)
- ✅ Valid expiration (high score)
- ✅ Required claims present (high score)
- ❌ No signature algorithm (low score)
- ❌ Expired token (low score)
- ❌ Missing claims (low score)

#### Understanding Critical Issues

**Common Issues**:
- **No Signature Algorithm**: Token uses `alg: "none"` (critical)
- **Expired Token**: Token has expired (warning)
- **Weak Nonce**: Nonce is too short or predictable (warning)
- **Missing Claims**: Required claims are missing (warning)
- **Invalid Issuer**: Issuer doesn't match expected value (error)

---

### Section 3: Token History

**Purpose**: Track tokens from previous OAuth flows.

#### History Display

**Information Shown**:
- **Flow Name**: Name of the OAuth flow
- **Timestamp**: When token was obtained
- **Token Type**: Type of token (access token, ID token, etc.)

**Display Format**:
- List of history entries
- Each entry shows flow name and timestamp
- Click to load token

#### History Actions

**1. Load from History**:
- Click on a history entry
- Loads token into analysis section
- Shows token source information

**2. Remove Entry**:
- Click "Remove" on a history entry
- Removes entry from history
- Confirmation required

**3. Clear History**:
- Click "Clear History" button
- Clears all history entries
- Confirmation required

#### History Persistence

**Storage**:
- History is stored in `localStorage`
- Persists across browser sessions
- Lost if browser data is cleared

**Automatic Tracking**:
- Tokens are automatically added to history after OAuth flows
- Flow name and timestamp are tracked
- No manual action required

---

### Section 4: Token Actions

**Purpose**: Perform actions on tokens.

#### Available Actions

**1. Clear Token**:
- Clears current token from input
- Resets analysis section
- Does not clear history

**2. Clear History**:
- Clears all token history entries
- Confirmation required
- Cannot be undone

**3. Revoke Token** (if supported):
- Revokes token via revocation endpoint
- Requires token endpoint configuration
- May not be available for all tokens

**4. Clear All Tokens**:
- Clears all tokens from browser storage
- Comprehensive cleanup
- See [Clearing All Tokens](#clearing-all-tokens) section

---

## Clearing All Tokens

### Overview

The "Clear All Tokens" functionality removes all OAuth/OIDC tokens from browser storage. This is useful for:
- Switching between environments
- Security cleanup
- Starting fresh
- Before sharing browser

### What Gets Cleared

**OAuth/OIDC Tokens**:
- Access tokens
- ID tokens
- Refresh tokens
- Client credentials tokens
- Device flow tokens

**Token Management Data**:
- Token analysis data
- Token history (optional)
- Flow source information
- Token cache entries

**Flow-Specific Tokens**:
- Authorization Code Flow tokens
- Implicit Flow tokens
- Client Credentials tokens
- Device Flow tokens
- All other flow-specific tokens

**Storage Locations**:
- `localStorage`: All token keys
- `sessionStorage`: All token keys
- Token cache: All cache entries

### How to Clear All Tokens

**From Token Management Page**:
1. Navigate to Token Management page
2. Click "Clear All Tokens" button
3. Confirm the action in the modal
4. Tokens are cleared immediately

**From Application Generator**:
- Tokens are automatically cleared when page loads
- No manual action required

**Result**:
- Success message with count of cleared items
- All tokens removed from storage
- Token input cleared
- Analysis section reset

### What Happens After Clearing

**Immediate Effects**:
- All tokens removed from browser storage
- Token input cleared
- Analysis section reset
- Token history cleared (if option selected)

**What's Preserved**:
- Application configuration
- Flow credentials (if stored separately)
- User preferences
- Other non-token data

**What's Lost**:
- All OAuth/OIDC tokens
- Token history (if cleared)
- Token analysis data
- Flow-specific token storage

---

## Understanding Token Analysis

### Token Decoding

**What It Shows**:
- **Header**: JWT header (algorithm, type, key ID)
- **Payload**: JWT payload (claims, user info, etc.)
- **Signature**: Token signature (not decoded)

**How to Read**:
- Header shows token algorithm and type
- Payload shows token claims (sub, exp, iat, etc.)
- Claims are color-coded (keys in red, values in blue)

### Security Score

**Score Ranges**:
- **90-100**: Excellent security (green)
- **70-89**: Good security (yellow)
- **50-69**: Fair security (orange)
- **0-49**: Poor security (red)

**What It Means**:
- Higher score = better security
- Lower score = security issues found
- Check critical issues for details

### Expiration Status

**Status Types**:
- **Valid**: Token is valid and not expired
- **Expired**: Token has expired
- **Expiring Soon**: Token expires within 1 hour

**What to Do**:
- **Valid**: Token can be used
- **Expired**: Generate new token
- **Expiring Soon**: Consider refreshing token

### Critical Issues

**Issue Types**:
- **Critical**: Security vulnerabilities (red)
- **Warning**: Potential issues (yellow)
- **Info**: Informational (blue)

**Common Issues**:
- No signature algorithm
- Expired token
- Weak nonce
- Missing required claims
- Invalid issuer

---

## Token History

### What Is Token History

Token history tracks tokens obtained from OAuth flows. Each entry includes:
- Flow name
- Timestamp
- Token type
- Token data

### Viewing History

**How to View**:
1. Navigate to Token Management page
2. Scroll to "Token History" section
3. View list of history entries

**History Entry Information**:
- Flow name (e.g., "Authorization Code Flow")
- Timestamp (when token was obtained)
- Token type (access token, ID token, etc.)

### Loading from History

**How to Load**:
1. Click on a history entry
2. Token is loaded into analysis section
3. Token source information is displayed

**What Happens**:
- Token is decoded
- Analysis begins automatically
- Source information is shown

### Managing History

**Remove Entry**:
1. Click "Remove" on a history entry
2. Confirm removal
3. Entry is removed from history

**Clear History**:
1. Click "Clear History" button
2. Confirm action
3. All history entries are cleared

**History Persistence**:
- History is stored in `localStorage`
- Persists across browser sessions
- Lost if browser data is cleared

---

## Troubleshooting

### Common Issues

#### "Token input is empty"

**Problem**: Token input field is empty.

**Solutions**:
1. Enter token manually
2. Click "Load from Storage" to load from storage
3. Click on a history entry to load from history
4. Complete an OAuth flow to obtain tokens

#### "Invalid token format"

**Problem**: Token is not in valid JWT format.

**Solutions**:
1. Check token format (should be JWT: `header.payload.signature`)
2. Ensure token is complete (not truncated)
3. Verify token is from a valid OAuth flow

#### "Token analysis failed"

**Problem**: Token analysis cannot be performed.

**Solutions**:
1. Check token is valid JWT format
2. Verify token is not corrupted
3. Try reloading token from storage or history

#### "No tokens found in storage"

**Problem**: No tokens available in browser storage.

**Solutions**:
1. Complete an OAuth flow to obtain tokens
2. Check browser storage is enabled
3. Verify tokens were saved (check browser DevTools)

#### "Token history is empty"

**Problem**: No token history entries.

**Solutions**:
1. Complete an OAuth flow (tokens are automatically added to history)
2. Check history was not cleared
3. Verify browser storage is enabled

#### "Clear all tokens failed"

**Problem**: Error when clearing tokens.

**Solutions**:
1. Check browser storage is enabled
2. Try clearing tokens individually
3. Check browser console for errors
4. Refresh page and try again

---

## FAQ

### General Questions

**Q: What tokens are cleared when I click "Clear All Tokens"?**  
A: All OAuth/OIDC tokens from localStorage and sessionStorage, including access tokens, ID tokens, refresh tokens, and flow-specific tokens.

**Q: Will clearing tokens affect my OAuth flows?**  
A: Yes, you'll need to complete OAuth flows again to obtain new tokens. Configuration and credentials are preserved.

**Q: Can I recover tokens after clearing?**  
A: No, cleared tokens cannot be recovered. You'll need to complete OAuth flows again to obtain new tokens.

**Q: Does clearing tokens clear my credentials?**  
A: No, credentials (client ID, client secret, etc.) are stored separately and are not cleared.

### Technical Questions

**Q: What is a security score?**  
A: A score from 0-100 that indicates token security. Higher scores indicate better security practices.

**Q: What does "expired token" mean?**  
A: The token has passed its expiration time and can no longer be used. Generate a new token.

**Q: What are critical issues?**  
A: Security vulnerabilities found in the token, such as missing signature algorithm or expired token.

**Q: How is token history stored?**  
A: Token history is stored in `localStorage` and persists across browser sessions.

### Security Questions

**Q: Is it safe to clear all tokens?**  
A: Yes, clearing tokens is safe and recommended when switching environments or for security cleanup.

**Q: Are tokens stored securely?**  
A: Tokens are stored in browser storage (localStorage/sessionStorage). For production, use secure token storage.

**Q: Should I clear tokens before sharing my browser?**  
A: Yes, clearing tokens before sharing your browser is recommended for security.

**Q: Can tokens be recovered after clearing?**  
A: No, cleared tokens cannot be recovered. You'll need to obtain new tokens.

---

## Additional Resources

- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [OAuth 2.0 Token Management](https://oauth.net/2/)
- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN - Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)

---

## Support

If you encounter issues not covered in this documentation:

1. Check the **Troubleshooting** section above
2. Review browser console for error messages
3. Verify browser storage is enabled
4. Check token format is valid JWT
5. Try refreshing the page
