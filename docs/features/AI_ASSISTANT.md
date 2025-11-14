# AI Assistant

The OAuth Playground includes an intelligent AI assistant that helps users navigate the app's capabilities and find information quickly.

## Features

### 🔍 Smart Search
- Searches through all OAuth flows, features, and documentation
- Understands natural language queries
- Returns relevant results ranked by relevance

### 💬 Conversational Interface
- Chat-based interface for easy interaction
- Quick question suggestions for common queries
- Typing indicators for natural feel

### 🔗 Direct Navigation
- Click on any suggested resource to navigate directly to it
- Links to flows, features, and documentation
- Contextual recommendations based on your question

## How to Use

### Opening the Assistant

1. Look for the floating purple chat button in the bottom-right corner
2. Click it to open the chat window
3. Start asking questions!

### Example Questions

**Flow Selection:**
- "Which flow should I use for my mobile app?"
- "How do I test device flows?"
- "What's the difference between OAuth and OIDC?"

**Configuration Help:**
- "How do I configure Authorization Code flow?"
- "How do I fix redirect URI errors?"
- "What is PKCE and when should I use it?"

**Feature Discovery:**
- "How do I decode a JWT token?"
- "How can I generate code examples?"
- "What MFA options are available?"

**Troubleshooting:**
- "Why am I getting a redirect URI mismatch?"
- "How do I inspect tokens?"
- "What scopes should I use?"

### Quick Questions

When you first open the assistant, you'll see suggested quick questions. Click any of them to get instant answers.

## Technical Details

### Architecture

The AI Assistant consists of three main components:

1. **AIAgentService** (`src/services/aiAgentService.ts`)
   - Maintains a searchable index of all app capabilities
   - Implements relevance-based search algorithm
   - Provides pattern-matched answers for common questions

2. **AIAssistant Component** (`src/components/AIAssistant.tsx`)
   - React component with chat interface
   - Manages conversation state
   - Handles navigation to suggested resources

3. **Capability Index**
   - Indexed data structure containing:
     - All OAuth/OIDC flows with descriptions and keywords
     - Features and their use cases
     - Documentation pages
     - Common troubleshooting scenarios

### Search Algorithm

The search uses a weighted relevance scoring system:

- **Exact title match**: 100 points
- **Title word match**: 50 points per word
- **Exact description match**: 30 points
- **Description word match**: 10 points per word
- **Keyword match**: 40 points for exact, 15 points for partial

Results are sorted by relevance score and limited to top 10 results.

### Pattern Matching

Common question patterns are pre-configured with detailed answers:

- Flow configuration instructions
- OAuth vs OIDC explanations
- Security feature explanations
- Troubleshooting guides
- Code generation help

## Extending the Assistant

### Adding New Flows

To add a new flow to the search index, edit `src/services/aiAgentService.ts`:

```typescript
flows: [
  {
    name: 'Your New Flow',
    description: 'Description of what this flow does',
    path: '/flows/your-new-flow',
    keywords: ['keyword1', 'keyword2', 'keyword3']
  },
  // ... existing flows
]
```

### Adding New Features

```typescript
features: [
  {
    name: 'Your New Feature',
    description: 'What this feature does and when to use it',
    path: '/docs/features/your-feature',
    keywords: ['feature', 'related', 'terms']
  },
  // ... existing features
]
```

### Adding Question Patterns

To add a new question pattern with a custom answer:

```typescript
const patterns = [
  {
    pattern: /your regex pattern here/i,
    answer: 'Your detailed answer with formatting',
    searchTerms: 'terms to search for related links'
  },
  // ... existing patterns
]
```

## Future Enhancements

Potential improvements for the AI Assistant:

- **LLM Integration**: Connect to OpenAI or other LLM for more sophisticated answers
- **Context Awareness**: Remember previous questions in the conversation
- **Code Examples**: Generate code snippets directly in chat
- **Flow Recommendations**: AI-powered flow selection based on requirements
- **Search History**: Save and recall previous searches
- **Multi-language Support**: Answers in different languages
- **Voice Input**: Speech-to-text for queries
- **Feedback Loop**: Learn from user interactions

## Accessibility

The AI Assistant is built with accessibility in mind:

- Keyboard navigation support (Enter to send, Esc to close)
- ARIA labels for screen readers
- High contrast colors for readability
- Responsive design for mobile devices

## Performance

- **Instant Search**: All searches are performed client-side for immediate results
- **Lightweight**: No external API calls required
- **Efficient**: Indexed data structure for fast lookups
- **Scalable**: Can handle hundreds of indexed items without performance impact

## Privacy

- All searches are performed locally in the browser
- No data is sent to external servers
- No conversation history is stored permanently
- Conversations reset when the chat window is closed

## Support

If you have questions or suggestions for the AI Assistant:

1. Check the [main documentation](/about)
2. Review the [troubleshooting guide](/docs/troubleshooting)
3. Open an issue in the repository

---

**Built with ❤️ to make OAuth learning easier**
