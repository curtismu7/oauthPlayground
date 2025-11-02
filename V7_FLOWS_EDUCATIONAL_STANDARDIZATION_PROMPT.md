# AI Prompt: Standardize Educational Content Across All V7 OAuth/OIDC Flows

## Context
This is an **OAuth and OIDC training/learning playground** designed to teach users about **both old and new OAuth and OIDC standards**. All OAuth grant types, deprecated patterns, and historical implementations are **INTENTIONAL** and must be **PRESERVED** for educational purposes.

## Objective
Review **ALL V7 flows** and ensure they have **consistent, comprehensive educational content** with the **same depth** and **same standardized sections**. Each flow must do a **great job teaching users** about:
1. **All facets of using an API** (authentication, authorization, tokens, endpoints, requests, responses)
2. **OAuth 2.0 standards** (RFC 6749, RFC 7636 PKCE, RFC 8693 Token Exchange, etc.)
3. **OIDC standards** (OpenID Connect Core 1.0, ID Token, UserInfo endpoint, etc.)
4. **Historical vs modern patterns** (OAuth 2.0 vs OAuth 2.1, deprecated grant types, migration paths)
5. **Security best practices** (why certain approaches are deprecated, what to use instead)

## V7 Flows to Standardize

### Primary V7 Flows (Must Review):
1. `OAuthAuthorizationCodeFlowV7.tsx` - OAuth/OIDC Authorization Code Flow
2. `OIDCHybridFlowV7.tsx` - OIDC Hybrid Flow
3. `ImplicitFlowV7.tsx` - OAuth Implicit Flow (deprecated but educational)
4. `ClientCredentialsFlowV7_Complete.tsx` - Client Credentials Flow (M2M)
5. `DeviceAuthorizationFlowV7.tsx` - Device Authorization Flow (RFC 8628)
6. `OAuthROPCFlowV7.tsx` - Resource Owner Password Credentials (deprecated but educational)
7. `RedirectlessFlowV7_Real.tsx` - Redirectless Flow (pi.flow)
8. `JWTBearerTokenFlowV7.tsx` - JWT Bearer Token Flow
9. `SAMLBearerAssertionFlowV7.tsx` - SAML Bearer Assertion Flow
10. `CIBAFlowV7.tsx` - CIBA Flow (RFC 9436)
11. `TokenExchangeFlowV7.tsx` - Token Exchange Flow (RFC 8693)
12. `PingOnePARFlowV7.tsx` - Pushed Authorization Requests (RFC 9126)
13. `RARFlowV7.tsx` - Rich Authorization Requests (RFC 9396)
14. `WorkerTokenFlowV7.tsx` - Worker Token Flow

## Required Components & Tooltips

### LearningTooltip Component Integration
**File:** `src/components/LearningTooltip.tsx`  
**Status:** ✅ Already created - ready to use

**MUST be integrated into ALL V7 flows** to provide contextual explanations. Add tooltips to:
- OAuth/OIDC terminology and concepts
- Flow-specific parameters
- API endpoints and methods
- Token types and structures
- Security mechanisms (PKCE, state, nonce)
- Deprecated patterns (with educational context)
- Best practices and warnings

**Usage Example:**
```tsx
import { LearningTooltip } from '../../components/LearningTooltip';

<LearningTooltip
  variant="learning"
  title="Authorization Code"
  content="The authorization code is a short-lived credential (typically 10 minutes) returned from the authorization server after user consent. It's single-use and must be exchanged server-side for tokens."
  placement="top"
>
  <span>Authorization Code</span>
</LearningTooltip>
```

**Tooltip Placement Requirements:**
- Add to all OAuth/OIDC terms (authorization code, access token, refresh token, id token, PKCE, state, nonce, etc.)
- Add to parameter names in forms and displays
- Add to API endpoint references
- Add to flow step titles and descriptions
- Add to security-related elements (warnings, best practices)

---

## Required Standardized Educational Sections

Each V7 flow **MUST** include these sections in this order (using `CollapsibleHeader` component):

### Section 1: Quick Start & Overview ✅
**Theme:** `green` (educational - even position)  
**Icon:** `<FiBook />`  
**Default State:** Expanded (`defaultCollapsed={false}`)

**Content Must Include:**
- **What You'll Get:** Clear explanation of tokens/artifacts returned (access_token, id_token, refresh_token, etc.)
  - Use `LearningTooltip` on all token types: `<LearningTooltip variant="info" content="...">access_token</LearningTooltip>`
- **Perfect For:** Use cases where this flow is appropriate
- **OAuth vs OIDC Comparison:** If applicable, side-by-side comparison
  - Use `LearningTooltip` on "OAuth 2.0" and "OIDC" terms
- **Standard/Version:** RFC number or specification reference
  - Use `LearningTooltip` on RFC numbers explaining what they specify
- **Key Concepts:** Core OAuth/OIDC concepts (Authorization Server, Resource Server, Client, Resource Owner, etc.)
  - **EVERY concept must have a tooltip:** `<LearningTooltip variant="learning" title="Authorization Server" content="...">Authorization Server</LearningTooltip>`
- **Flow Diagram:** High-level flow visualization
- **When to Use:** Specific scenarios for this flow
- **When NOT to Use:** Alternatives or deprecated status (if applicable)

### Section 2: Configuration & Setup 🔧
**Theme:** `orange` → `green` (orange when incomplete, green when complete)  
**Icon:** `<FiSettings />`  
**Default State:** Expanded (`defaultCollapsed={false}`)

**Content Must Include:**
- **Application Configuration & Credentials:** Full credential setup
- **Required vs Optional Fields:** Clear indication
- **Client Authentication Methods:** Explanation of each method (client_secret_post, client_secret_basic, private_key_jwt, etc.)
- **Scopes Explanation:** What each scope does, OAuth vs OIDC scopes
- **Redirect URI Configuration:** Why it matters, validation rules
- **PingOne-Specific Requirements:** Any PingOne quirks or requirements
- **Validation:** Real-time validation with helpful error messages

### Section 3: Step-by-Step Educational Sections 📚

For each step in the flow, include educational collapsible sections:

#### Step 1: Build Authorization URL 🚀
**Theme:** `blue` (flow execution)  
**Icon:** `<FiSend />`

**Must Explain:**
- **What is an Authorization URL?** - Purpose and structure
  - Use `LearningTooltip` on "Authorization URL" term
- **OAuth 2.0 Parameters:** Every parameter explained (response_type, client_id, redirect_uri, scope, state, nonce, etc.)
  - **CRITICAL:** Every parameter name in the UI must have a tooltip:
    ```tsx
    <LearningTooltip 
      variant="learning" 
      title="response_type"
      content="Specifies which OAuth grant type to use. 'code' = Authorization Code flow, 'token' = Implicit flow (deprecated)."
      placement="right"
    >
      response_type
    </LearningTooltip>
    ```
  - Parameters requiring tooltips: `response_type`, `client_id`, `redirect_uri`, `scope`, `state`, `nonce`, `code_challenge`, `code_challenge_method`
- **OIDC-Specific Parameters:** login_hint, prompt, acr_values, max_age, etc.
  - Add tooltips to all OIDC parameters: `login_hint`, `prompt`, `acr_values`, `max_age`, `claims`
- **PKCE Parameters:** code_challenge, code_challenge_method (if applicable)
  - Add tooltips: `code_challenge`, `code_challenge_method`, `code_verifier`
- **URL Structure Breakdown:** Base URL + query parameters
- **Security Parameters:** state (CSRF protection), nonce (replay protection)
  - Add tooltips explaining security mechanisms
- **URL Encoding:** Why and how parameters are encoded
- **PingOne Requirements:** Any PingOne-specific requirements
- **RFC References:** Link to relevant RFC sections
  - Add tooltips on RFC numbers explaining what they specify

#### Step 2: Send Authorization Request 🔐
**Theme:** `blue` (flow execution)  
**Icon:** `<FiSend />`

**Must Explain:**
- **HTTP Method:** GET or POST (and why)
- **Redirect vs Popup:** Both modes explained
- **State Parameter:** CSRF protection mechanism
- **Browser Redirect:** What happens in the browser
- **User Authorization:** What user sees and does
- **Authorization Server Response:** What comes back

#### Step 3: Receive Authorization Code/Response 📦
**Theme:** `highlight` or `default` (results)  
**Icon:** `<FiPackage />`

**Must Explain:**
- **Callback URL Processing:** How callback is handled
- **Authorization Code:** What it is, why it's short-lived
- **Error Responses:** Common errors and what they mean
- **State Validation:** Why we validate state parameter
- **URL Fragment vs Query:** Differences for implicit flows
- **Token Extraction:** How tokens are extracted from URL

#### Step 4: Exchange Code for Tokens 🔑
**Theme:** `blue` (flow execution)  
**Icon:** `<FiSend />`

**Must Explain:**
- **Token Exchange Process:** RFC 6749 Section 4.1.3
- **Request Parameters:** grant_type, code, redirect_uri, client_id, client_secret, code_verifier
- **Why Server-Side?** - Client secret protection
- **PKCE Validation:** How code_verifier is validated
- **Redirect URI Matching:** Why it must match exactly
- **Token Response:** Structure of response (access_token, refresh_token, id_token, expires_in, token_type, scope)
- **OIDC ID Token:** If applicable, explain ID token structure and validation
- **Security Requirements:** Single-use codes, expiration, validation

#### Step 5: Token Response Display 📦
**Theme:** `highlight` or `default` (results)  
**Icon:** `<FiPackage />`

**Must Explain:**
- **Access Token:** What it is, how to use it, lifetime
- **Refresh Token:** What it is, when to use it, lifetime
- **ID Token (OIDC):** JWT structure, claims, validation
- **Token Type:** Usually "Bearer"
- **Expires In:** Token lifetime
- **Scope:** Granted scopes (may differ from requested)
- **Token Security:** Never expose in URLs, use HTTPS, store securely

#### Step 6: Use Access Token (UserInfo, API Calls) 🌐
**Theme:** `blue` (flow execution)  
**Icon:** `<FiSend />`

**Must Explain:**
- **Bearer Token Usage:** How to include in Authorization header
- **UserInfo Endpoint (OIDC):** Purpose, standard endpoint
- **API Calls:** Making authenticated requests
- **Token Validation:** How resource servers validate tokens
- **Token Introspection:** RFC 7662 - validating tokens
- **Error Handling:** 401 Unauthorized, 403 Forbidden, token refresh

#### Step 7: Token Refresh (if applicable) 🔄
**Theme:** `blue` (flow execution)  
**Icon:** `<FiRefreshCw />`

**Must Explain:**
- **Why Refresh?** - Access tokens expire
- **Refresh Token Flow:** RFC 6749 Section 6
- **Request Parameters:** grant_type=refresh_token, refresh_token, scope
- **Response:** New access token, optionally new refresh token
- **Rotation:** Token rotation policies

#### Step 8: Advanced Topics & Best Practices 📖
**Theme:** `yellow` (educational - odd position)  
**Icon:** `<FiBook />`

**Must Include:**
- **Security Best Practices:** Specific to this flow
- **Common Mistakes:** What to avoid
- **Production Considerations:** Scaling, monitoring, error handling
- **OAuth 2.0 vs 2.1 Differences:** If applicable
- **Migration Guidance:** If deprecated, how to migrate
- **Testing:** How to test this flow
- **Troubleshooting:** Common issues and solutions

## Educational Content Depth Requirements

Each section must include:

### 1. Conceptual Explanations
- **What:** Clear definition
- **Why:** Purpose and rationale
- **How:** Step-by-step process
- **When:** Use cases and scenarios

### 2. Standards References
- **RFC Numbers:** Link to relevant RFCs
- **OAuth 2.0 Sections:** Specific sections (e.g., "RFC 6749 Section 4.1.3")
- **OIDC Specifications:** OpenID Connect Core references
- **Deprecation Notes:** If deprecated, explain when/why

### 3. API Facets Coverage
For each API interaction, explain:
- **Endpoint URL:** Structure and components
- **HTTP Method:** GET, POST, PUT, DELETE
- **Request Headers:** Content-Type, Authorization, Accept, etc.
- **Request Body:** Structure, parameters, encoding
- **Response Codes:** 200, 400, 401, 403, 500 and what they mean
- **Response Headers:** Content-Type, Cache-Control, etc.
- **Response Body:** Structure, fields, parsing
- **Error Responses:** Error format, error codes, error descriptions

### 4. OAuth/OIDC Standards Coverage
- **OAuth 2.0 Core (RFC 6749):** Authorization framework
- **PKCE (RFC 7636):** Proof Key for Code Exchange
- **OIDC Core 1.0:** OpenID Connect specification
- **Token Exchange (RFC 8693):** Token exchange protocol
- **PAR (RFC 9126):** Pushed Authorization Requests
- **RAR (RFC 9396):** Rich Authorization Requests
- **CIBA (RFC 9436):** Client Initiated Backchannel Authentication
- **Device Flow (RFC 8628):** Device Authorization Grant
- **Token Introspection (RFC 7662):** Token introspection
- **OAuth 2.1:** Latest recommendations (what changed from 2.0)

### 5. Security Education
- **Why security matters:** Real-world attack scenarios
- **Common vulnerabilities:** CSRF, code interception, token theft
- **Protection mechanisms:** State parameter, PKCE, HTTPS, token rotation
- **Best practices:** What to do and what NOT to do
- **Deprecated patterns:** Why they're deprecated, alternatives

### 6. Code Examples
- **Request Examples:** cURL commands, fetch examples
- **Response Examples:** JSON structures
- **Error Examples:** What errors look like and how to handle
- **Real-world scenarios:** Practical use cases

## Section Standardization Rules

### 1. CollapsibleHeader Usage
```tsx
<CollapsibleHeader
  title="Section Title"
  subtitle="Section subtitle or description"
  defaultCollapsed={false} // or true for advanced sections
  icon={<FiIcon />}
  theme="green" // orange, blue, yellow, green, highlight/default
>
  {/* Educational content */}
</CollapsibleHeader>
```

### 2. Color/Theme Standardization
- 🟠 **Orange** (`theme="orange"` + `<FiSettings />`): Configuration sections
- 🔵 **Blue** (`theme="blue"` + `<FiSend />`): Flow execution/API calls
- 🟡 **Yellow** (`theme="yellow"` + `<FiBook />`): Educational sections (odd: 1st, 3rd, 5th)
- 🟢 **Green** (`theme="green"` + `<FiBook />` or `<FiCheckCircle />`): Educational sections (even: 2nd, 4th, 6th) + success
- 💙 **Highlight/Default** (`theme="highlight"` or omitted + `<FiPackage />`): Results, responses, received data

### 3. Educational Content Structure
Each educational section should use:
- **InfoBox components** for key information
- **Code blocks** for examples (with syntax highlighting)
- **Comparison tables** for OAuth vs OIDC
- **Bullet lists** for concepts
- **Warning boxes** for security concerns
- **Success boxes** for best practices

### 4. API Call Display
All API calls must use `EnhancedApiCallDisplay` or `EnhancedApiCallDisplayService` with:
- **Request details:** Method, URL, headers, body
- **Response details:** Status, headers, body
- **Educational context:** What this call does, why it's needed
- **Error handling:** What errors mean and how to fix

## Implementation Checklist

For each V7 flow, ensure:

### Educational Sections:
- [ ] Section 1: Quick Start & Overview (green theme, expanded)
- [ ] Section 2: Configuration & Setup (orange→green theme, expanded)
- [ ] Step 1: Build Authorization URL (blue theme, educational content)
- [ ] Step 2: Send Authorization Request (blue theme, educational content)
- [ ] Step 3: Receive Response/Code (highlight theme, educational content)
- [ ] Step 4: Exchange Code for Tokens (blue theme, educational content)
- [ ] Step 5: Token Response Display (highlight theme, educational content)
- [ ] Step 6: Use Access Token (blue theme, educational content)
- [ ] Step 7: Token Refresh (if applicable, blue theme)
- [ ] Step 8: Advanced Topics & Best Practices (yellow theme)

### Educational Content Depth:
- [ ] All sections have consistent depth
- [ ] All API interactions explained (method, headers, body, response)
- [ ] RFC references included
- [ ] OAuth 2.0 vs OAuth 2.1 differences explained (if applicable)
- [ ] OAuth vs OIDC differences explained (if applicable)
- [ ] Deprecated patterns explained with context (why deprecated, migration path)
- [ ] Security best practices included
- [ ] Code examples provided
- [ ] Error handling explained

### LearningTooltip Integration:
- [ ] Import LearningTooltip component in flow file
- [ ] Add tooltips to ALL OAuth/OIDC terminology:
  - Authorization Server, Resource Server, Client, Resource Owner
  - Authorization Code, Access Token, Refresh Token, ID Token
  - PKCE terms (code_verifier, code_challenge, code_challenge_method)
  - Security terms (state, nonce, CSRF protection)
- [ ] Add tooltips to ALL parameter names:
  - response_type, client_id, redirect_uri, scope, state, nonce
  - grant_type, code, refresh_token
  - login_hint, prompt, acr_values, max_age (OIDC)
  - audience, resource, claims (advanced)
- [ ] Add tooltips to API endpoint references:
  - /as/authorize, /as/token, /as/userinfo, /as/introspect
- [ ] Add tooltips to HTTP methods and status codes
- [ ] Add tooltips to token fields (access_token, expires_in, token_type, etc.)
- [ ] Add tooltips to flow step titles
- [ ] Add tooltips to security warnings and best practices
- [ ] Use appropriate variants: `learning` for concepts, `info` for general info, `warning` for security, `security` for critical security items

## Examples of Good Educational Content

### Good: PKCE Explanation
```tsx
<CollapsibleHeader title="PKCE (Proof Key for Code Exchange)" theme="yellow" icon={<FiBook />}>
  <div>
    <h4>What is PKCE?</h4>
    <p>PKCE (RFC 7636) is a security extension that protects against authorization code interception attacks.</p>
    
    <h4>How PKCE Works:</h4>
    <ol>
      <li>Generate code_verifier: Random 43-128 character string</li>
      <li>Generate code_challenge: SHA256(code_verifier), base64url encoded</li>
      <li>Send code_challenge in authorization URL</li>
      <li>Send code_verifier when exchanging code for tokens</li>
      <li>Server validates: SHA256(code_verifier) === code_challenge</li>
    </ol>
    
    <h4>Why PKCE?</h4>
    <p>Even if an attacker intercepts the authorization code, they cannot use it without the code_verifier, which is only sent in the POST body during token exchange.</p>
    
    <h4>OAuth 2.1 Requirement:</h4>
    <p>OAuth 2.1 requires PKCE for all authorization code flows, especially for public clients (apps without client secrets).</p>
  </div>
</CollapsibleHeader>
```

### Good: Token Exchange Explanation (WITH Tooltips)
```tsx
import { LearningTooltip } from '../../components/LearningTooltip';

<CollapsibleHeader title="Exchange Authorization Code for Tokens" theme="blue" icon={<FiSend />}>
  <div>
    <h4>
      OAuth 2.0 Token Exchange (
      <LearningTooltip 
        variant="info" 
        title="RFC 6749 Section 4.1.3"
        content="The OAuth 2.0 specification section that defines the token exchange process. This is the standard way to convert authorization codes into access tokens."
      >
        RFC 6749 Section 4.1.3
      </LearningTooltip>
      )
    </h4>
    <p>
      This step converts the short-lived{' '}
      <LearningTooltip 
        variant="learning" 
        title="Authorization Code"
        content="A temporary credential returned by the authorization server after user consent. It's single-use, short-lived (~10 minutes), and must be exchanged server-side."
      >
        authorization code
      </LearningTooltip>
      {' '}into long-lived{' '}
      <LearningTooltip 
        variant="learning" 
        title="Access Token"
        content="A credential used to access protected resources on behalf of the user. Typically valid for 1 hour, stored securely, and sent in Authorization header."
      >
        tokens
      </LearningTooltip>.
    </p>
    
    <h4>Request Details:</h4>
    <CodeBlock>
      POST{' '}
      <LearningTooltip 
        variant="info" 
        title="Token Endpoint"
        content="The OAuth 2.0 endpoint where authorization codes are exchanged for tokens. Format: https://auth.pingone.com/{envId}/as/token"
      >
        /as/token
      </LearningTooltip>
      {'\n'}
      Content-Type: application/x-www-form-urlencoded
      
      <LearningTooltip variant="learning" title="grant_type" content="Specifies the OAuth grant type. 'authorization_code' indicates we're exchanging a code for tokens.">grant_type</LearningTooltip>=authorization_code
      &<LearningTooltip variant="learning" title="code" content="The authorization code received from the authorization server.">code</LearningTooltip>={authorization_code}
      &<LearningTooltip variant="security" title="redirect_uri" content="MUST exactly match the redirect_uri from the authorization request. This prevents authorization code interception attacks.">redirect_uri</LearningTooltip>={exact_match_required}
      &<LearningTooltip variant="learning" title="client_id" content="Identifies your application to the authorization server.">client_id</LearningTooltip>={your_client_id}
      &<LearningTooltip variant="security" title="client_secret" content="Authenticates your application. NEVER expose this to the browser - token exchange must happen server-side.">client_secret</LearningTooltip>={your_client_secret}
      &<LearningTooltip variant="security" title="code_verifier" content="PKCE verifier that must match the code_challenge from step 1. Proves you're the same client that started the flow.">code_verifier</LearningTooltip>={pkce_verifier}
    </CodeBlock>
    
    <h4>Response:</h4>
    <CodeBlock>
      {`{
        "<LearningTooltip variant="learning" title="access_token" content="Bearer token used to authenticate API requests. Include in Authorization header.">access_token</LearningTooltip>": "eyJ...",
        "<LearningTooltip variant="learning" title="token_type" content="Type of token, usually 'Bearer' indicating it should be sent in Authorization header.">token_type</LearningTooltip>": "Bearer",
        "<LearningTooltip variant="learning" title="expires_in" content="Number of seconds until the access token expires. Typically 3600 (1 hour).">expires_in</LearningTooltip>": 3600,
        "<LearningTooltip variant="learning" title="refresh_token" content="Long-lived token used to obtain new access tokens without re-authorization.">refresh_token</LearningTooltip>": "def...",
        "<LearningTooltip variant="learning" title="id_token" content="OIDC JWT containing user identity information. Only returned when 'openid' scope is requested.">id_token</LearningTooltip>": "eyJ...",  // OIDC only
        "<LearningTooltip variant="learning" title="scope" content="Space-separated list of granted scopes. May differ from requested scopes.">scope</LearningTooltip>": "openid profile email"
      }`}
    </CodeBlock>
    
    <h4>Security Requirements:</h4>
    <ul>
      <li>
        <LearningTooltip variant="security" title="redirect_uri validation" content="The redirect_uri in token request MUST exactly match (character-by-character) the one in authorization request. This prevents attackers from using intercepted codes.">redirect_uri must EXACTLY match</LearningTooltip> authorization request
      </li>
      <li>
        <LearningTooltip variant="security" title="PKCE validation" content="The code_verifier is hashed and compared to the code_challenge from step 1. This proves the same client is completing the flow.">code_verifier must match code_challenge</LearningTooltip> from step 1
      </li>
      <li>
        <LearningTooltip variant="info" title="Single-use code" content="Authorization codes can only be used once. After successful exchange, the code becomes invalid.">Authorization code is single-use</LearningTooltip> and expires in ~10 minutes
      </li>
      <li>
        <LearningTooltip variant="security" title="Server-side exchange" content="Client secret must NEVER be exposed to browser. Token exchange must happen on backend server or via secure proxy.">Must happen server-side</LearningTooltip> to protect client_secret
      </li>
    </ul>
  </div>
</CollapsibleHeader>
```

## Deliverables

1. **Updated V7 Flow Files:** All flows with standardized educational content
2. **LearningTooltip Integration:** All flows with tooltips on OAuth/OIDC terms, parameters, endpoints
3. **Reusable Services:** Create or update services to provide consistent educational content
4. **Standardization Document:** Document showing before/after for each flow
5. **Tooltip Coverage Report:** List of all tooltips added and where
6. **Verification Report:** Confirming all flows have same depth, sections, and tooltip coverage

## Success Criteria

- ✅ All V7 flows have identical educational section structure
- ✅ All sections have consistent depth and detail
- ✅ All API interactions fully explained (method, headers, body, response)
- ✅ All OAuth/OIDC standards referenced with RFC numbers
- ✅ Users can learn OAuth/OIDC from any V7 flow
- ✅ Deprecated patterns explained with educational context
- ✅ Security best practices clearly communicated
- ✅ Code examples provided for all concepts
- ✅ **LearningTooltip component integrated into ALL V7 flows**
- ✅ **ALL OAuth/OIDC terminology has tooltips** (authorization code, access token, PKCE, state, nonce, etc.)
- ✅ **ALL parameter names have tooltips** (response_type, client_id, redirect_uri, scope, etc.)
- ✅ **ALL API endpoints have tooltips** (/as/authorize, /as/token, /as/userinfo, etc.)
- ✅ **Tooltips provide contextual learning** - users can hover to learn without leaving the page
- ✅ **Tooltip variants used appropriately** (learning for concepts, security for warnings, info for general)

## Tooltip Priority List

For each V7 flow, add tooltips in this priority order:

### Priority 1 - Critical OAuth/OIDC Terms (Must Have):
- Authorization Server, Resource Server, Client, Resource Owner
- Authorization Code, Access Token, Refresh Token, ID Token
- Scope, Redirect URI, Client ID, Client Secret
- PKCE terms: code_verifier, code_challenge, code_challenge_method
- Security: state, nonce, CSRF protection

### Priority 2 - Flow Parameters (Must Have):
- response_type, grant_type, code, redirect_uri
- client_id, client_secret, scope
- login_hint, prompt, acr_values, max_age (OIDC)
- audience, resource, claims (advanced)
- All flow-specific parameters

### Priority 3 - API Endpoints (Should Have):
- /as/authorize, /as/token, /as/userinfo, /as/introspect
- /as/par (PAR), /as/rar (RAR), /as/device (Device Flow)
- Flow-specific endpoints

### Priority 4 - HTTP Details (Should Have):
- HTTP methods (GET, POST)
- Status codes (200, 400, 401, 403, 500)
- Headers (Content-Type, Authorization, Accept)
- Response fields (access_token, expires_in, token_type, etc.)

### Priority 5 - Flow-Specific Concepts (Nice to Have):
- Flow-specific terminology
- PingOne-specific requirements
- Best practices and warnings

---

**Start by reviewing the existing V7 flows, identifying gaps, and then standardizing them one by one, ensuring each has:**
1. **Same comprehensive educational structure**
2. **LearningTooltip components integrated throughout**
3. **All OAuth/OIDC terms and parameters have tooltips**
4. **Consistent depth and teaching quality across all flows**

