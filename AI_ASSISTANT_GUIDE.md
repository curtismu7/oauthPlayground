# AI Assistant - Quick Start Guide

## What is it?

An intelligent chat assistant built into your OAuth Playground that helps users:
- Find the right OAuth flow for their needs
- Understand OAuth and OIDC concepts
- Navigate to relevant documentation and features
- Troubleshoot common issues
- Get instant answers to questions

## How to Use

### 1. Open the Assistant

Look for the **purple floating chat button** in the bottom-right corner of any page:

```
🤖 [Chat Button]
```

Click it to open the chat window.

### 2. Ask Questions

Type any question about OAuth, OIDC, or the playground features:

**Examples:**
- "How do I configure Authorization Code flow?"
- "What's the difference between OAuth and OIDC?"
- "Which flow should I use for my mobile app?"
- "How do I test device flows?"
- "What is PKCE?"
- "How do I decode a JWT token?"
- "Why am I getting a redirect URI error?"

### 3. Use Quick Questions

When you first open the assistant, you'll see suggested questions. Click any to get instant answers.

### 4. Navigate to Resources

The assistant provides clickable links to:
- 🔄 OAuth/OIDC Flows
- ⚡ Features and Tools
- 📖 Documentation Pages

Click any link to navigate directly to that resource.

## Features

### Smart Search
- Searches through all 15+ OAuth flows
- Indexes 12+ features and tools
- Covers documentation and guides
- Understands natural language

### Conversational Interface
- Chat-based interaction
- Typing indicators
- Message history during session
- Quick question suggestions

### Direct Navigation
- One-click access to flows
- Jump to features
- Open documentation
- Context-aware recommendations

## What Can It Answer?

### Flow Selection
✅ "Which flow should I use?"
✅ "What's the best flow for mobile apps?"
✅ "How do device flows work?"

### Configuration Help
✅ "How do I set up Authorization Code flow?"
✅ "How do I configure redirect URIs?"
✅ "What credentials do I need?"

### Concept Explanations
✅ "What is PKCE?"
✅ "Explain OAuth vs OIDC"
✅ "What are scopes and claims?"

### Troubleshooting
✅ "Redirect URI mismatch error"
✅ "How do I inspect tokens?"
✅ "Token validation failed"

### Feature Discovery
✅ "How do I generate code examples?"
✅ "Can I test MFA flows?"
✅ "How do I decode JWT tokens?"

## Technical Details

### Architecture

**Backend Service** (`src/services/aiAgentService.ts`)
- Maintains searchable index of capabilities
- Implements relevance-based search
- Pattern-matched answers for common questions

**Frontend Component** (`src/components/AIAssistant.tsx`)
- React component with styled-components
- Chat interface with message history
- Navigation integration

**Capability Index**
- 15+ OAuth/OIDC flows
- 12+ features and tools
- Documentation pages
- Keywords and descriptions

### Search Algorithm

Weighted relevance scoring:
- Exact title match: 100 points
- Title word match: 50 points
- Description match: 30 points
- Keyword match: 40 points

Results sorted by relevance, top 10 shown.

### Performance

- ⚡ Instant search (client-side)
- 🔒 No external API calls
- 💾 No data stored
- 📱 Mobile responsive

## Extending the Assistant

### Add New Flows

Edit `src/services/aiAgentService.ts`:

```typescript
flows: [
  {
    name: 'Your New Flow',
    description: 'What this flow does',
    path: '/flows/your-flow',
    keywords: ['keyword1', 'keyword2']
  }
]
```

### Add New Features

```typescript
features: [
  {
    name: 'Your Feature',
    description: 'Feature description',
    path: '/docs/features/your-feature',
    keywords: ['feature', 'related', 'terms']
  }
]
```

### Add Question Patterns

```typescript
patterns: [
  {
    pattern: /your question pattern/i,
    answer: 'Your detailed answer',
    searchTerms: 'terms for related links'
  }
]
```

## Testing

Run the test suite:

```bash
npm run test:run -- src/services/__tests__/aiAgentService.test.ts
```

All 16 tests should pass ✅

## Files Created

1. **Service**: `src/services/aiAgentService.ts`
   - Core search and answer logic
   - Capability index
   - Relevance scoring

2. **Component**: `src/components/AIAssistant.tsx`
   - Chat UI
   - Message handling
   - Navigation integration

3. **Tests**: `src/services/__tests__/aiAgentService.test.ts`
   - 16 test cases
   - Search validation
   - Answer verification

4. **Documentation**: `docs/features/AI_ASSISTANT.md`
   - Detailed feature documentation
   - Extension guide
   - Architecture overview

5. **Integration**: `src/App.tsx`
   - Added AIAssistant component
   - Available on all pages

## Next Steps

### Immediate Enhancements
1. Add more question patterns for common queries
2. Index additional flows as they're added
3. Add more features to the index
4. Improve answer formatting

### Future Enhancements
1. **LLM Integration**: Connect to OpenAI for smarter answers
2. **Context Memory**: Remember conversation history
3. **Code Generation**: Generate code snippets in chat
4. **Voice Input**: Speech-to-text support
5. **Multi-language**: Support multiple languages
6. **Analytics**: Track popular questions
7. **Feedback**: Learn from user interactions

## Support

- **Documentation**: See `docs/features/AI_ASSISTANT.md`
- **Tests**: Run `npm run test:run -- src/services/__tests__/aiAgentService.test.ts`
- **Issues**: Check the main README for troubleshooting

---

**Ready to use!** Just start your app and look for the purple chat button in the bottom-right corner. 🚀
