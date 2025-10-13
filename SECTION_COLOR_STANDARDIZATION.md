# Section Header Color Standardization Plan

## 🎨 Color Scheme with Icons

| Color | Theme Value | Icon | Purpose | When to Use |
|-------|-------------|------|---------|-------------|
| 🟠 **Orange** | `theme="orange"` | `<FiSettings />` ⚙️ | Credentials & Configuration | Input forms, settings, app config |
| 🔵 **Blue** | `theme="blue"` | `<FiSend />` 🚀 | Flow Execution & Actions | API calls, token exchange, authorization |
| 🟡 **Yellow** | `theme="yellow"` | `<FiBook />` 📚 | Educational (Odd) | 1st, 3rd, 5th... educational sections |
| 🟢 **Green** | `theme="green"` | `<FiCheckCircle />` ✅ | Educational (Even) + Success | 2nd, 4th, 6th... educational + completions |
| 💙 **Light Blue** | `theme="default"` | `<FiPackage />` 📦 | Results & Received Data | Displaying received codes, tokens, responses |

### Quick Reference
```
🟠 Orange  + ⚙️  FiSettings     = Configuration
🔵 Blue    + 🚀 FiSend         = Flow Execution
🟡 Yellow  + 📚 FiBook         = Educational (Odd)
🟢 Green   + ✅ FiCheckCircle  = Educational (Even) / Success
💙 Default + 📦 FiPackage      = Results/Received
```

---

## 🔄 Dynamic Color Change Feature

**Config sections turn GREEN when complete:**
- Orange → Green when all required fields are filled
- Requires tracking completion state
- Visual feedback for users

---

## 📋 Section-by-Section Mapping

### **OAuthAuthorizationCodeFlowV6.tsx**

#### Step 0 - Configuration
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| OAuth 2.0 Authorization Code Overview | default | `yellow` | Educational (1st) |
| Application Configuration & Credentials | default | `orange` → `green` | Config (dynamic) |
| Advanced OAuth Parameters (Optional) | default | `orange` | Config |

#### Step 1 - PKCE Generation
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| What is PKCE? | default | `yellow` | Educational (1st) |
| Understanding Code Verifier & Code Challenge | default | `green` | Educational (2nd) |

#### Step 2 - Authorization URL
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Understanding Authorization Requests | default | `yellow` | Educational (1st) |
| Authorization URL Parameters Deep Dive | default | `green` | Educational (2nd) |

#### Step 3 - User Login
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Authorization Response Overview | default | `yellow` | Educational (1st) |
| Authorization Code Details | default | `default` | Results/Received |

#### Step 4 - Token Exchange
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Token Exchange Overview | default | `yellow` | Educational (1st) |
| Token Exchange Details | default | `blue` | Flow Execution |

#### Step 8 - Completion
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Flow Complete | default | `green` | Completion/Success |

---

### **OIDCAuthorizationCodeFlowV6.tsx**

#### Step 0 - Configuration
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| OIDC Authorization Code Overview | default | `yellow` | Educational (1st) |
| OIDC Authorization Code Configuration | default | `orange` → `green` | Config (dynamic) |
| Advanced OIDC Parameters (Optional) | default | `orange` | Config |

#### Step 1 - PKCE Generation
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| What is PKCE? | default | `yellow` | Educational (1st) |
| Understanding Code Verifier & Code Challenge | default | `green` | Educational (2nd) |

#### Step 2 - Authorization URL
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Understanding Authorization Requests | default | `yellow` | Educational (1st) |
| Authorization URL Parameters Deep Dive | default | `green` | Educational (2nd) |

#### Step 3 - User Login
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Authorization Response Overview | default | `yellow` | Educational (1st) |
| Authorization Code Details | default | `default` | Results/Received |

#### Step 4 - Token Exchange
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Token Exchange Overview | default | `yellow` | Educational (1st) |
| Token Exchange Details | default | `blue` | Flow Execution |

---

### **DeviceAuthorizationFlowV6.tsx**

#### Step 0 - Configuration
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Select Device Type (Visual Example) | default | `orange` | Config/Setup |
| Device Authorization Flow Overview | default | `yellow` | Educational (1st) |
| How It Works | default | `yellow` | Educational (2nd - BUT user wants yellow) |
| Advanced OAuth Parameters (Optional) | default | `orange` | Config |

#### Step 1 - Request Device Code
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Request Device Code | default | `blue` | Flow Execution |
| Device Code Received | default | `default` | Results/Received |

#### Step 2 - User Authorization
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Select Device Type (Visual Example) | default | `orange` | Config/Setup |
| User Authorization Required | default | `blue` | Flow Execution |

#### Step 3 - Token Polling
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Tokens Received | default | `default` | Results/Received |

#### Step 4 - Completion
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Flow Complete | default | `green` | Completion/Success |

---

### **OIDCHybridFlowV6.tsx**

#### Step 0 - Configuration
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Application Configuration & Credentials | default | `orange` → `green` | Config (dynamic) |

#### Step 1 - Authorization URL
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Authorization URL Generation | default | `blue` | Flow Execution |

---

### **ClientCredentialsFlowV6.tsx**

#### Step 0 - Configuration
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Client Credentials Flow Overview | default | `yellow` | Educational (1st) |
| Application Configuration & Credentials | default | `orange` → `green` | Config (dynamic) |

#### Step 1 - Token Request
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Token Request | default | `blue` | Flow Execution |
| Token Response | default | `default` | Results/Received |

---

### **JWTBearerTokenFlowV6.tsx**

#### Step 0 - Configuration
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| JWT Bearer Token Flow Overview | default | `yellow` | Educational (1st) |
| Application Configuration & Credentials | default | `orange` → `green` | Config (dynamic) |
| JWT Signature Configuration | default | `orange` → `green` | Config (dynamic) |

#### Step 1 - JWT Generation
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| JWT Assertion Generation | default | `blue` | Flow Execution |
| Generated JWT Assertion | default | `default` | Results/Received |

#### Step 2 - Token Exchange
| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Token Exchange | default | `blue` | Flow Execution |
| Token Response | default | `default` | Results/Received |

---

### **SAMLBearerAssertionFlowV6.tsx**

| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| SAML Assertion Builder | default | `orange` | Config/Builder |
| Generated SAML Assertion | default | `default` | Results/Received |
| Token Request | default | `blue` | Flow Execution |
| Token Response | default | `default` | Results/Received |

---

### **PingOnePARFlowV6.tsx**

| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| PAR Flow Detailed Overview | default | `yellow` | Educational (1st) |
| PKCE Parameters Overview | default | `green` | Educational (2nd) |
| PAR Request Overview | default | `yellow` | Educational (3rd) |
| Authorization URL Overview | default | `green` | Educational (4th) |
| PAR Flow Complete | default | `green` | Completion/Success |

---

### **OIDCDeviceAuthorizationFlowV6.tsx**

| Section Title | Current | New Theme | Reason |
|--------------|---------|-----------|--------|
| Select Device Type (Visual Example) | default | `orange` | Config/Setup |
| Device Authorization Flow Overview | default | `yellow` | Educational (1st) |
| How It Works | default | `yellow` | Educational (user wants yellow) |
| Request Device Code | default | `blue` | Flow Execution |
| Device Code Received | default | `default` | Results/Received |
| User Authorization Required | default | `blue` | Flow Execution |
| Tokens Received | default | `default` | Results/Received |
| Flow Complete | default | `green` | Completion/Success |

---

## 🔧 Implementation Steps

### Phase 1: Add Yellow Theme ✅
- [x] Add `yellow` to theme type definition
- [x] Add yellow gradient styling to HeaderButton

### Phase 2: Apply Static Themes
- [ ] Update all CollapsibleHeader components with appropriate `theme` prop
- [ ] Test visual consistency across all flows

### Phase 3: Dynamic Config Completion (Orange → Green)
- [ ] Create completion tracking logic
- [ ] Add state management for config completion
- [ ] Implement theme switching based on completion state
- [ ] Add visual transition animation

### Phase 4: Testing & Refinement
- [ ] Visual QA across all flows
- [ ] Ensure color contrast meets accessibility standards
- [ ] User feedback and adjustments

---

## 📝 Notes

1. **"How It Works" sections**: User specifically wants these as YELLOW (not green), even though they're often the 2nd educational section
2. **EducationalContentService**: Should be converted to CollapsibleHeader with yellow/green alternating
3. **Completion sections**: Always GREEN for success/completion state
4. **Config sections**: Start ORANGE, turn GREEN when all required fields are complete

---

## 🎯 Quick Reference

```typescript
// Educational sections (alternating)
<CollapsibleHeader theme="yellow" /> // 1st, 3rd, 5th...
<CollapsibleHeader theme="green" />  // 2nd, 4th, 6th...

// Exception: "How It Works" always yellow
<CollapsibleHeader title="How It Works" theme="yellow" />

// Config sections (dynamic)
<CollapsibleHeader 
  theme={isComplete ? "green" : "orange"} 
  title="Application Configuration & Credentials"
/>

// Flow execution
<CollapsibleHeader theme="blue" title="Token Exchange" />

// Results/received data
<CollapsibleHeader theme="default" title="Device Code Received" />

// Completion/success
<CollapsibleHeader theme="green" title="Flow Complete" />
```
