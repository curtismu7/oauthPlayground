# AI Assistant - Quick Reference Card

## 🚀 Quick Start
1. Click the **purple chat button** (bottom-right corner)
2. Type your question
3. Get instant answers with links

## 💬 Common Questions

### Flow Selection
```
"Which flow should I use?"
"What's the best flow for mobile apps?"
"How do device flows work?"
"Which flow for backend services?"
```

### Configuration
```
"How do I configure Authorization Code flow?"
"How do I set up redirect URIs?"
"What credentials do I need?"
"How do I enable PKCE?"
```

### Concepts
```
"What is PKCE?"
"What's the difference between OAuth and OIDC?"
"Explain scopes and claims"
"What are refresh tokens?"
```

### Troubleshooting
```
"Redirect URI mismatch error"
"How do I inspect tokens?"
"Token validation failed"
"Why is my token expired?"
```

### Features
```
"How do I generate code examples?"
"How do I decode a JWT token?"
"Can I test MFA flows?"
"How do I test password reset?"
```

## 🔍 What It Searches

### 15+ OAuth Flows
- Authorization Code
- Client Credentials
- Device Code
- Implicit
- JWT Bearer
- CIBA
- Hybrid
- ROPC
- Token Refresh
- Token Introspection
- Token Revocation
- UserInfo
- SAML Bearer
- PAR
- Worker Token

### 12+ Features
- PKCE
- OIDC Discovery
- Token Inspector
- Code Generator
- Redirect URIs
- Scopes & Claims
- MFA
- Password Reset
- Session Management
- DPoP
- RAR
- Response Modes

### Documentation
- Getting Started
- OAuth vs OIDC
- Security Best Practices
- Troubleshooting
- PingOne Setup

## 🎯 Tips

### Get Better Results
- Be specific: "Authorization Code flow" vs "auth"
- Use keywords: "PKCE", "device", "token", "redirect"
- Ask naturally: "How do I..." or "What is..."

### Quick Actions
- Click suggested links to navigate
- Use quick questions when starting
- Press Enter to send message
- Press Esc to close (coming soon)

## 📍 Access Points

### Main App
- Look for purple button (bottom-right)
- Available on all pages
- Persistent across navigation

### Demo Page
- Visit: `/ai-assistant`
- See examples and features
- Learn how to use it

## 🔧 For Developers

### Files
- Service: `src/services/aiAgentService.ts`
- Component: `src/components/AIAssistant.tsx`
- Tests: `src/services/__tests__/aiAgentService.test.ts`

### Extend It
```typescript
// Add new flow
flows: [{
  name: 'Your Flow',
  description: 'Description',
  path: '/flows/your-flow',
  keywords: ['keyword1', 'keyword2']
}]

// Add new feature
features: [{
  name: 'Your Feature',
  description: 'Description',
  path: '/docs/features/your-feature',
  keywords: ['feature', 'terms']
}]

// Add question pattern
patterns: [{
  pattern: /your pattern/i,
  answer: 'Your answer',
  searchTerms: 'search terms'
}]
```

### Test It
```bash
npm run test:run -- src/services/__tests__/aiAgentService.test.ts
```

## 🎨 Design

### Colors
- Primary: `#667eea` (purple)
- Secondary: `#764ba2` (dark purple)
- Background: `#f8f9fa` (light gray)
- Text: `#333` (dark gray)

### Icons
- 🔄 Flows
- ⚡ Features
- 📖 Documentation
- 🤖 Assistant

## 📊 Performance

- ⚡ Instant search (< 1ms)
- 🔒 No external API calls
- 💾 No data stored
- 📱 Mobile responsive
- ♿ Accessible

## 🆘 Support

### Not Finding What You Need?
1. Try different keywords
2. Check the About page
3. Browse the flows menu
4. Visit the demo page

### Technical Issues?
1. Check browser console
2. Verify app is running
3. Clear browser cache
4. Check documentation

## 🎉 Pro Tips

1. **Start with quick questions** - Click suggested questions to see how it works
2. **Be conversational** - Ask naturally like you would a person
3. **Use keywords** - Include terms like "OAuth", "OIDC", "flow", "token"
4. **Click links** - Navigate directly to resources from chat
5. **Try variations** - If first search doesn't help, rephrase

## 📚 Learn More

- **Full Docs**: `docs/features/AI_ASSISTANT.md`
- **Quick Guide**: `AI_ASSISTANT_GUIDE.md`
- **Implementation**: `AI_ASSISTANT_IMPLEMENTATION_SUMMARY.md`
- **Demo Page**: http://localhost:3000/ai-assistant

---

**Happy exploring!** 🚀
