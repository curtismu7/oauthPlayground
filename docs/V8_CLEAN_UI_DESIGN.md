# V8 Clean UI Design - Grouped & Tooltips

## Design Principles

✅ **No dark lines** - Use subtle backgrounds and spacing  
✅ **Grouped sections** - Related options in one box  
✅ **Tooltips on hover** - Explain what each option does  
✅ **Clean & minimal** - Focus on clarity  
✅ **Accessible** - Keyboard navigation, screen readers  

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  QUICK START CONFIGURATION                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Client Type                                    [?]  │   │
│  │                                                     │   │
│  │ ○ Public Client                                     │   │
│  │   SPA, Mobile, Desktop, CLI                         │   │
│  │                                                     │   │
│  │ ○ Confidential Client                              │   │
│  │   Backend, Server, Microservice                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Application Type                               [?]  │   │
│  │                                                     │   │
│  │ ○ Web Application                                   │   │
│  │ ○ Single Page Application (SPA)                     │   │
│  │ ○ Mobile Application                                │   │
│  │ ○ Desktop Application                               │   │
│  │ ○ Command Line Interface (CLI)                      │   │
│  │ ○ Machine-to-Machine (M2M)                          │   │
│  │ ○ Backend Service                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Environment                                    [?]  │   │
│  │                                                     │   │
│  │ ○ Development (localhost)                           │   │
│  │ ○ Staging (https required)                          │   │
│  │ ○ Production (maximum security)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Specification                                  [?]  │   │
│  │                                                     │   │
│  │ ○ OAuth 2.0                                         │   │
│  │ ○ OAuth 2.1                                         │   │
│  │ ○ OpenID Connect                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Auto-Selected Configuration                         │   │
│  │                                                     │   │
│  │ Flow: Authorization Code Flow                       │   │
│  │ Client Type: Public                                 │   │
│  │ PKCE: Required                                      │   │
│  │ Redirect URI: Required                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tooltip Content

### Client Type [?]

**What it does:**
Determines how your application authenticates with the OAuth server.

**Public Client:**
- Cannot securely store a client secret
- Examples: Single Page Apps, Mobile Apps, Desktop Apps, CLI tools
- Requires PKCE for security
- No client secret field

**Confidential Client:**
- Can securely store a client secret
- Examples: Backend servers, microservices, APIs
- Can use all authentication methods
- Requires client secret

**Why it matters:**
This is the most fundamental decision. It determines whether your app can use a client secret and which authentication methods are available.

---

### Application Type [?]

**What it does:**
Describes what kind of application you're building. This helps us recommend the right OAuth flow and security settings.

**Web Application:**
- Server-side web application (Node.js, Python, Java, etc.)
- Recommended: Authorization Code Flow
- Client Type: Confidential
- Can securely store client secret

**Single Page Application (SPA):**
- Browser-based JavaScript app (React, Vue, Angular, etc.)
- Recommended: Authorization Code Flow + PKCE
- Client Type: Public
- No client secret (runs in browser)

**Mobile Application:**
- iOS or Android app
- Recommended: Authorization Code Flow + PKCE
- Client Type: Public
- No client secret (runs on device)

**Desktop Application:**
- Windows, macOS, or Linux app
- Recommended: Authorization Code Flow + PKCE
- Client Type: Public
- No client secret (runs locally)

**Command Line Interface (CLI):**
- Command-line tool or script
- Recommended: Device Code Flow or Authorization Code Flow + PKCE
- Client Type: Public
- No client secret

**Machine-to-Machine (M2M):**
- Service-to-service communication
- Recommended: Client Credentials Flow
- Client Type: Confidential
- Requires client secret
- No user involved

**Backend Service:**
- Microservice or backend API
- Recommended: Client Credentials Flow
- Client Type: Confidential
- Requires client secret
- No user involved

**Why it matters:**
Different application types have different security requirements and use different OAuth flows. Selecting the right type helps us recommend the best configuration.

---

### Environment [?]

**What it does:**
Specifies where your application will run. This determines security requirements and validation rules.

**Development (localhost):**
- Running on your local machine
- HTTPS: Not required
- PKCE: Optional
- Allows: http://localhost:*
- Best for: Testing and development

**Staging (https required):**
- Pre-production environment
- HTTPS: Required
- PKCE: Recommended
- Allows: https:// only
- Best for: Testing before production

**Production (maximum security):**
- Live production environment
- HTTPS: Required
- PKCE: Required
- Allows: https:// only
- Best for: Real users and data

**Why it matters:**
Production environments need maximum security. Development environments need flexibility for testing. This setting ensures you're using appropriate security levels.

---

### Specification [?]

**What it does:**
Selects which OAuth/OIDC specification version to use.

**OAuth 2.0:**
- Standard OAuth 2.0 (RFC 6749)
- Supports: Authorization Code, Implicit, Client Credentials, ROPC, Device Code
- PKCE: Optional
- HTTPS: Not required
- Best for: Legacy systems and general use

**OAuth 2.1:**
- Modern OAuth 2.0 with security best practices
- Supports: Authorization Code (PKCE required), Client Credentials, Device Code
- PKCE: Required
- HTTPS: Required
- Deprecated: Implicit, ROPC
- Best for: New applications and maximum security

**OpenID Connect:**
- Authentication layer on top of OAuth 2.0
- Supports: Authorization Code, Implicit, Hybrid, Device Code
- Adds: ID Token, UserInfo endpoint
- Best for: Applications that need user authentication

**Why it matters:**
Different specifications have different security levels and features. OAuth 2.1 is more secure but less flexible. OIDC adds authentication on top of OAuth 2.0.

---

## Tooltip Implementation

### React Component Example

```typescript
interface TooltipProps {
  title: string;
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ title, content, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#3b82f6',
          padding: '0 4px',
          marginLeft: '4px'
        }}
        aria-label={`Help: ${title}`}
      >
        [?]
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px',
            width: '300px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
            {title}
          </h4>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
            {content}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Close
          </button>
        </div>
      )}

      {children}
    </div>
  );
};
```

### Usage Example

```typescript
<div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
    <label style={{ fontWeight: '600', fontSize: '14px' }}>
      Client Type
    </label>
    <Tooltip
      title="Client Type"
      content="Determines how your application authenticates. Public clients (SPA, Mobile) cannot store secrets. Confidential clients (Backend) can store secrets securely."
    >
      <span />
    </Tooltip>
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input type="radio" name="clientType" value="public" />
      <span>
        <strong>Public Client</strong>
        <small style={{ display: 'block', color: '#666' }}>
          SPA, Mobile, Desktop, CLI
        </small>
      </span>
    </label>

    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input type="radio" name="clientType" value="confidential" />
      <span>
        <strong>Confidential Client</strong>
        <small style={{ display: 'block', color: '#666' }}>
          Backend, Server, Microservice
        </small>
      </span>
    </label>
  </div>
</div>
```

---

## Color Scheme

### Backgrounds (No Dark Lines)
- **Primary Section**: `#f9fafb` (light gray)
- **Hover State**: `#f3f4f6` (slightly darker gray)
- **Selected State**: `#dbeafe` (light blue)
- **Info Box**: `#f0f9ff` (very light blue)
- **Warning Box**: `#fef3c7` (light yellow)

### Text
- **Primary**: `#1f2937` (dark gray)
- **Secondary**: `#6b7280` (medium gray)
- **Tertiary**: `#9ca3af` (light gray)
- **Link**: `#3b82f6` (blue)

### Borders
- **Subtle**: `#e5e7eb` (light gray)
- **Normal**: `#d1d5db` (medium gray)
- **Focus**: `#3b82f6` (blue)

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ QUICK START CONFIGURATION                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Client Type                                    [?]  │   │
│ │ Background: #f9fafb                                 │   │
│ │ Border: 1px solid #e5e7eb                           │   │
│ │ Padding: 16px                                       │   │
│ │ Border-radius: 8px                                  │   │
│ │                                                     │   │
│ │ ○ Public Client                                     │   │
│ │ ○ Confidential Client                              │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Application Type                               [?]  │   │
│ │ Background: #f9fafb                                 │   │
│ │ Border: 1px solid #e5e7eb                           │   │
│ │ Padding: 16px                                       │   │
│ │ Border-radius: 8px                                  │   │
│ │                                                     │   │
│ │ ○ Web Application                                   │   │
│ │ ○ Single Page Application (SPA)                     │   │
│ │ ○ Mobile Application                                │   │
│ │ ○ Desktop Application                               │   │
│ │ ○ Command Line Interface (CLI)                      │   │
│ │ ○ Machine-to-Machine (M2M)                          │   │
│ │ ○ Backend Service                                   │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Environment                                    [?]  │   │
│ │ Background: #f9fafb                                 │   │
│ │ Border: 1px solid #e5e7eb                           │   │
│ │ Padding: 16px                                       │   │
│ │ Border-radius: 8px                                  │   │
│ │                                                     │   │
│ │ ○ Development (localhost)                           │   │
│ │ ○ Staging (https required)                          │   │
│ │ ○ Production (maximum security)                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Specification                                  [?]  │   │
│ │ Background: #f9fafb                                 │   │
│ │ Border: 1px solid #e5e7eb                           │   │
│ │ Padding: 16px                                       │   │
│ │ Border-radius: 8px                                  │   │
│ │                                                     │   │
│ │ ○ OAuth 2.0                                         │   │
│ │ ○ OAuth 2.1                                         │   │
│ │ ○ OpenID Connect                                    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Auto-Selected Configuration                         │   │
│ │ Background: #f0f9ff                                 │   │
│ │ Border: 1px solid #bfdbfe                           │   │
│ │ Padding: 16px                                       │   │
│ │ Border-radius: 8px                                  │   │
│ │                                                     │   │
│ │ Flow: Authorization Code Flow                       │   │
│ │ Client Type: Public                                 │   │
│ │ PKCE: Required                                      │   │
│ │ Redirect URI: Required                              │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Spacing & Sizing

- **Section Padding**: 16px
- **Section Margin**: 16px bottom
- **Option Gap**: 8px
- **Border Radius**: 8px
- **Font Size (Label)**: 14px, weight 600
- **Font Size (Description)**: 13px, weight 400
- **Font Size (Help)**: 13px, weight 400
- **Line Height**: 1.5

---

## Accessibility

✅ **Keyboard Navigation**
- Tab through all options
- Space/Enter to select
- Escape to close tooltips

✅ **Screen Readers**
- Proper labels for all inputs
- aria-label for help buttons
- Semantic HTML structure

✅ **Color Contrast**
- All text meets WCAG AA standards
- Not relying on color alone

✅ **Focus Indicators**
- Clear focus ring on all interactive elements
- Visible focus state

---

## Responsive Design

### Desktop (1024px+)
- 4 sections in single column
- Full width tooltips
- Comfortable spacing

### Tablet (768px - 1023px)
- 4 sections in single column
- Adjusted tooltip positioning
- Maintained spacing

### Mobile (< 768px)
- 4 sections in single column
- Tooltips positioned above/below
- Reduced padding
- Larger touch targets

---

## Implementation Checklist

- [ ] Remove all dark border lines
- [ ] Group related options in boxes
- [ ] Add subtle background colors
- [ ] Implement tooltip component
- [ ] Add tooltip content for each section
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test responsive design
- [ ] Verify color contrast
- [ ] Test on mobile devices

---

**Version**: 8.0.0  
**Status**: Design Complete - Ready for Implementation  
**Last Updated**: 2024-11-16
