# Code Generator - Quick Reference Card

## 🚀 Quick Start

### Test It Now
```bash
npm run dev
# Navigate to: https://localhost:3000/flows/kroger-grocery-store-mfa
# Scroll to: "Code Examples - Production Ready"
```

## 📊 What's Available

### Frontend (18 samples)
| Code Type | Language | Samples |
|-----------|----------|---------|
| Ping SDK (JavaScript) | TypeScript | 6 steps |
| REST API (Fetch) | TypeScript | 6 steps |
| REST API (Axios) | TypeScript | 6 steps |

### Backend (12 samples)
| Code Type | Language | Samples |
|-----------|----------|---------|
| Ping SDK (Node.js) | JavaScript | 6 steps |
| Python (Requests) | Python | 6 steps |

### Flow Steps (All platforms)
1. Authorization (OAuth 2.0 + PKCE)
2. Worker Token (Client Credentials)
3. Device Selection (List MFA devices)
4. MFA Challenge (Send OTP)
5. MFA Verification (Verify OTP)
6. Device Registration (Register device)

## 🎯 How to Use

### 1. Select Category
```
Frontend → Ping SDK, REST API (Fetch/Axios)
Backend  → Node.js, Python
Mobile   → Coming soon
```

### 2. Select Code Type
```
Frontend:
  - Ping SDK (JavaScript)
  - REST API (Fetch)
  - REST API (Axios)

Backend:
  - Ping SDK (Node.js)
  - Python (Requests)
```

### 3. Click Flow Step Tab
```
Tab 1: Authorization
Tab 2: Worker Token
Tab 3: Device Selection
Tab 4: MFA Challenge
Tab 5: MFA Verification
Tab 6: Device Registration
```

### 4. Update Configuration
```
Environment ID → Updates in code
Client ID      → Updates in code
Redirect URI   → Updates in code
User ID        → Updates in code
```

### 5. Use Code
```
Copy     → Copies to clipboard
Download → Downloads file (.ts, .js, .py)
Format   → Formats code
Reset    → Resets to original
```

## 📁 File Locations

### Service
```
src/services/codeGeneration/
├── codeGenerationService.ts    # Main service
└── templates/
    ├── frontend/
    │   ├── pingSDKTemplates.ts
    │   └── restApiTemplates.ts
    └── backend/
        └── nodeTemplates.ts
```

### Components
```
src/components/
├── MfaFlowCodeGenerator.tsx    # Integration
└── InteractiveCodeEditor.tsx   # UI
```

### Usage
```
src/pages/flows/
└── KrogerGroceryStoreMFA.tsx   # Uses generator
```

## 🔧 API Reference

### CodeGenerationService
```typescript
const service = new CodeGenerationService();

const result = service.generate({
  category: 'frontend',
  codeType: 'ping-sdk-js',
  flowStep: 'authorization',
  language: 'typescript',
  config: {
    environmentId: 'abc123',
    clientId: 'client-id',
    redirectUri: 'https://app.com/callback',
    userId: 'user-123',
  },
});

// Returns:
{
  code: string,           // Generated code
  language: string,       // 'typescript', 'javascript', 'python'
  dependencies: string[], // ['axios', 'express']
  description: string,    // Human-readable description
}
```

### MfaFlowCodeGenerator
```typescript
<MfaFlowCodeGenerator
  environmentId="abc123"
  clientId="client-id"
  redirectUri="https://app.com/callback"
  userId="user-123"
/>
```

## 📦 Dependencies

### Frontend
```json
{
  "ping-sdk-js": ["@pingidentity/pingone-js-sdk"],
  "rest-api-fetch": [],
  "rest-api-axios": ["axios"]
}
```

### Backend
```json
{
  "node-js": ["express", "express-session", "node-fetch"],
  "python": ["flask", "requests"]
}
```

## 🎨 Code Examples

### Frontend - Ping SDK
```typescript
import { PingOneClient } from '@pingidentity/pingone-js-sdk';

const client = new PingOneClient({
  environmentId: 'YOUR_ENVIRONMENT_ID',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: 'https://your-app.com/callback',
});

async function startAuthorization() {
  const authUrl = await client.authorize({
    scope: 'openid profile email',
    responseType: 'code',
    usePKCE: true,
  });
  window.location.href = authUrl;
}
```

### Frontend - REST API (Fetch)
```typescript
async function startAuthorization() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const authUrl = new URL(`https://auth.pingone.com/${environmentId}/as/authorize`);
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  
  window.location.href = authUrl.toString();
}
```

### Backend - Node.js
```javascript
const express = require('express');
const app = express();

app.get('/auth/login', (req, res) => {
  const authUrl = `https://auth.pingone.com/${environmentId}/as/authorize`;
  res.redirect(authUrl);
});

app.listen(3000);
```

### Backend - Python
```python
from flask import Flask, redirect
import requests

app = Flask(__name__)

@app.route('/auth/login')
def login():
    auth_url = f"https://auth.pingone.com/{environment_id}/as/authorize"
    return redirect(auth_url)

app.run(port=3000)
```

## ✅ Testing Checklist

- [ ] Navigate to Kroger MFA flow
- [ ] Find code generator section
- [ ] Select "Frontend" category
- [ ] Select "Ping SDK (JavaScript)"
- [ ] Click through all 6 flow tabs
- [ ] Update configuration fields
- [ ] Verify code updates
- [ ] Click "Copy Code" button
- [ ] Click "Download" button
- [ ] Switch to "Backend" category
- [ ] Select "Python (Requests)"
- [ ] Verify different code appears
- [ ] No console errors

## 🐛 Troubleshooting

### Code doesn't update
- Check browser console for errors
- Verify category/type selection
- Try refreshing page

### Copy doesn't work
- Check browser permissions
- Try manual copy (Ctrl+C)
- Check clipboard access

### Download doesn't work
- Check browser download settings
- Verify file extension
- Check download folder

## 📚 Documentation

### Full Guides
- `CODE_GENERATOR_MVP_COMPLETE.md` - Complete implementation
- `CODE_GENERATOR_TEST_GUIDE.md` - Testing instructions
- `CODE_GENERATOR_ARCHITECTURE.md` - Technical details
- `SESSION_CODE_GENERATOR_COMPLETE.md` - Session summary

### Quick References
- `CODE_GENERATOR_QUICK_START.md` - Getting started
- `CODE_GENERATOR_QUICK_REFERENCE.md` - This file

## 🚀 Status

- ✅ 30 code samples implemented
- ✅ 5 platforms supported
- ✅ 6 flow steps covered
- ✅ Configuration injection working
- ✅ Copy/download functional
- ✅ Zero TypeScript errors
- ✅ Production ready

## 📞 Support

### Issues?
1. Check console for errors
2. Review test guide
3. Check architecture docs
4. Verify file locations

### Need More?
- Add React templates
- Add Angular templates
- Add Vue templates
- Add mobile templates

---

**Quick Reference v1.0**
**Last Updated**: November 9, 2025
**Status**: ✅ Production Ready
