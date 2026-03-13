# AIAssistant — Expert Analysis & Improvement Plan

> Author: GitHub Copilot (Claude Sonnet 4.6)  
> Date: 2025  
> Scope: Full codebase review of `AIAssistant/src/` (18 source files, ~4,000 lines)

---

## 1. What's Already Good

Before digging into improvements, the current architecture has several strong qualities worth preserving:

| Strength | Detail |
|---|---|
| **Multi-source AI pipeline** | Groq LLM → local knowledge base fallback → MCP live data card → Brave web search. Clean escalation logic in `handleSend()`. |
| **Standalone Vite app** | Runs independently on port 3002; can work with or without the main OAuth Playground. |
| **`fullPage` prop** | `AIAssistant` already toggles between floating panel and full-page layout — the right abstraction for a popout. |
| **Context toggles** | Per-message toggle flags (APIs / Specs / Workflows / UserGuide / Web / Live) give users fine control over what the LLM sees. |
| **Rich message metadata** | `Message` type carries `groqUsed`, `mcpResult`, `webResult`, `links`, `rawJson` — solid foundation for future display features. |
| **Rolling Groq history** | 20-entry `groqHistoryRef` keeps conversation context across turns without unbounded token growth. |
| **Security model** | Groq API key never touches the browser — `groqService.ts` calls `/api/groq/chat` which injects the key server-side. |

---

## 2. Priority Improvements

Ranked by impact/effort ratio.

### 2.1 Popout Window [HIGH — See Section 3 for full plan]

**Problem:** The assistant is stuck as a floating widget or full-page view. When users are working in the main OAuth Playground they have no way to open the assistant in a separate browser window for side-by-side use.

**Solution:** Follow the exact pattern used by the V9 Debug Log Viewer — `window.open('/popout', ...)` from a button in the header + a dedicated `/popout` route that renders `<AIAssistant fullPage />`.

---

### 2.2 Streaming Groq Responses [HIGH]

**Problem:** Groq with Llama 3.3 70B can take 2-5 seconds to return a full response. During this time the user sees only the typing indicator. This feels slow and breaks the conversational rhythm.

**Current flow:**
```
POST /api/groq/chat → ... wait ... → full JSON response
```

**Solution:** Use Groq's streaming API (`stream: true`) and return a `text/event-stream` (SSE) response from the backend. The frontend appends tokens as they arrive.

**Files to change:**
- `server.js` / `AIAssistant-backend`: add `POST /api/groq/chat/stream` that streams SSE
- `AIAssistant/src/services/groqService.ts`: add `callGroqStream(message, history, onToken)` using `EventSource` or `fetch` with a `ReadableStream`
- `AIAssistant/src/components/AIAssistant.tsx`: replace `handleSend`'s Groq call with streaming; update active message bubble incrementally

**Effort:** Medium (2-3 hours). Groq supports `stream: true` out-of-the-box.

---

### 2.3 Conversation Persistence [HIGH]

**Problem:** Every page refresh wipes the conversation history. Users lose valuable answers and context.

**Solution (Simple):** Persist `messages[]` to `localStorage` with a session key. Clear on explicit "New chat" action.

```ts
// On mount: load from localStorage
const stored = localStorage.getItem('ai-assistant-messages');
const [messages, setMessages] = useState<Message[]>(
  stored ? JSON.parse(stored) : [welcomeMessage]
);

// On every messages update:
useEffect(() => {
  localStorage.setItem('ai-assistant-messages', JSON.stringify(messages));
}, [messages]);
```

**Add a "New Chat" button** (🗑️) to the header that clears both `messages` state and `groqHistoryRef.current`.

**Effort:** Low (30 minutes).

---

### 2.4 Message Export / Copy [MEDIUM]

**Problem:** Users get great answers but have no way to save or share them.

**Solution:** Add per-message action buttons on hover:
- 📋 **Copy** — copies message text to clipboard
- 💾 **Save** — appends to a saved-answers list in `localStorage`  
- Export full conversation as Markdown (button in header)

```ts
const exportConversation = () => {
  const md = messages.map(m => 
    `**${m.type === 'user' ? 'You' : 'Assistant'}:** ${m.content}`
  ).join('\n\n');
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ai-assistant-${Date.now()}.md`;
  a.click();
};
```

**Effort:** Low (1 hour).

---

### 2.5 Dynamic Knowledge Base [MEDIUM]

**Problem:** `aiAgentService.ts` builds a 1,000-line static index in the constructor. Adding new flows, APIs, or documentation means editing this file manually.

**Solution:** Move the capability index to a JSON file (`AIAssistant/src/data/capabilityIndex.json`) that is imported statically. This decouples content from logic and makes it easy to update without touching service code.

Longer term: fetch the index from the backend at startup (`GET /api/ai/knowledge`) so it can be updated without a frontend rebuild.

**Effort:** Medium (2-3 hours for initial extraction; longer for backend serving).

---

### 2.6 Smarter Context Window Management [MEDIUM]

**Problem:** The 20-message rolling history is naïve — old irrelevant turns can pollute the Groq context. A user asking about PKCE doesn't benefit from 10 previous turns about MFA policies.

**Solution:** Topic-aware context trimming:
1. Tag each message with a topic (`auth`, `users`, `mfa`, etc.) on ingestion using a fast local classifier (keyword matching).
2. When building `groqHistory`, include the last 3-5 turns of the **same topic** plus the system prompt, rather than purely the last N turns.

**Effort:** Medium (2-4 hours).

---

### 2.7 Retry & Error Recovery [MEDIUM]

**Problem:** When Groq fails (network error, API key quota), the error message appears in chat but the user has to retype their message.

**Solution:**
- Add a "🔄 Retry" button on error messages that re-submits the last user message
- Add exponential back-off on 429 (rate limit) responses
- Show Groq model info + lat/tps in the GroqBadge (already available from API usage response)

**Effort:** Low (1 hour).

---

### 2.8 Multi-line Input & Code Detection [MEDIUM]

**Problem:** The input is a single-line `<input>` — users can't paste multi-line questions or code snippets naturally.

**Solution:**
- Change `Input` styled component from `<input>` to `<textarea>` with `rows={1}` and auto-grow
- Detect when pasted content looks like JSON/code and offer a "Format as code" toggle
- Change send shortcut from `onKeyPress` Enter to Shift+Enter for newline, Enter for send

**Effort:** Low-Medium (1-2 hours).

---

### 2.9 Component Decomposition [LOW]

**Problem:** `AIAssistant.tsx` is 1,890 lines. It mixes business logic, UI, event handlers, and 60+ styled components.

**Suggested split:**
```
components/
  AIAssistant/
    AIAssistant.tsx          ← state + handlers (keep)
    ChatHeader.tsx           ← header bar with toggles
    MessageList.tsx          ← messages + typing indicator
    MessageBubble.tsx        ← single message + MCP/Brave result cards
    InputBar.tsx             ← prompts guide + input + send
    ConfirmDialog.tsx        ← token refresh dialog
    styles.ts                ← all styled components
```

Breaking this apart makes each piece independently testable and reduces cognitive load when updating.

**Effort:** Medium (3-4 hours, zero functional change).

---

### 2.10 Persist Toggle State [LOW]

**Problem:** The context toggles (APIs / Specs / Workflows / UserGuide / Web / Live) reset to their defaults on every page load. Users who always want "Live" enabled have to re-check it every time.

**Solution:** Persist toggle state to `localStorage` and load on mount:

```ts
const [includeApiDocs, setIncludeApiDocs] = useState(() =>
  JSON.parse(localStorage.getItem('ai-toggles-apiDocs') ?? 'true')
);
```

Or use a single object key `ai-assistant-toggles: { apiDocs, specs, workflows, userGuide, web, live }`.

**Effort:** Very low (15 minutes).

---

### 2.11 Brave Result Summarization [LOW]

**Problem:** Brave web results show title + URL + a short snippet. The raw snippets are often incomplete or context-free.

**Solution:** After fetching Brave results, pass the top 3 results through Groq with the prompt: *"Summarize these search results in the context of: [user question]"* and display the summary above the raw links.

This creates a hybrid RAG pipeline: web retrieval + LLM synthesis.

**Effort:** Low (1 hour — Groq history already supports this flow).

---

## 3. Popout Window — Detailed Implementation Plan

This feature mirrors the pattern used by the V9 Debug Log Viewer (`debugLogViewerPopoutHelperV9.ts` + `DebugLogViewerPopoutV9.tsx`). The goal is to allow users to click a button in the assistant header and open the full assistant in a separate browser window.

### 3.1 Architecture Overview

```
Main window (port 3002)                 Popout window
─────────────────────────               ─────────────────────────
AIAssistant.tsx header                  /popout route
  └── "⊞ Pop out" button                 └── AIAssistantPopoutPage.tsx
       └── calls openAIAssistantPopout()      └── <AIAssistant fullPage />
            └── window.open('/popout', ...)
```

The popout is just another route in the same Vite app. No new server or backend needed. The `fullPage` prop already renders the assistant as a full-window layout.

### 3.2 Files to Create / Modify

| File | Change |
|---|---|
| `AIAssistant/src/utils/aiAssistantPopoutHelper.ts` | **NEW** — `window.open` helper |
| `AIAssistant/src/pages/AIAssistantPopoutPage.tsx` | **NEW** — minimal shell page for `/popout` route |
| `AIAssistant/src/App.tsx` | Add `/popout` route |
| `AIAssistant/src/components/AIAssistant.tsx` | Add "Pop out" button to header (hidden in `fullPage` mode) |

### 3.3 Step-by-Step Implementation

#### Step 1 — Create the popout helper

**`AIAssistant/src/utils/aiAssistantPopoutHelper.ts`**

```ts
let popoutWindow: Window | null = null;

/**
 * Opens the AI Assistant in a separate browser window.
 * If the window is already open, focuses it instead of opening a new one.
 */
export function openAIAssistantPopout(): void {
  if (popoutWindow && !popoutWindow.closed) {
    popoutWindow.focus();
    return;
  }

  const width = 900;
  const height = 780;
  const left = Math.max(0, window.screenX + window.outerWidth / 2 - width / 2);
  const top = Math.max(0, window.screenY + window.outerHeight / 2 - height / 2);

  popoutWindow = window.open(
    '/popout',
    'aiAssistantPopout',
    `width=${width},height=${height},left=${left},top=${top},` +
    `resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
  );
}
```

#### Step 2 — Create the popout page

**`AIAssistant/src/pages/AIAssistantPopoutPage.tsx`**

```tsx
import React from 'react';
import { createGlobalStyle } from 'styled-components';
import AIAssistant from '../components/AIAssistant';

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f2f5;
    overflow: hidden;
  }
`;

/**
 * Standalone popout page — renders the AI Assistant as a full-window experience.
 * Opened by openAIAssistantPopout() via window.open('/popout').
 */
const AIAssistantPopoutPage: React.FC = () => {
  const handleClose = () => window.close();

  return (
    <>
      <GlobalStyle />
      <AIAssistant
        fullPage
        onClose={handleClose}
      />
    </>
  );
};

export default AIAssistantPopoutPage;
```

> **Note:** This introduces an `onClose` prop (currently unused in `AIAssistant.tsx`) that, when provided in `fullPage` mode, renders a "Close window" button instead of the collapse/expand/close controls. This lets the user close the popout window from inside the UI.

#### Step 3 — Register the route in App.tsx

In `AIAssistant/src/App.tsx`, add:

```tsx
// Add import at top
import AIAssistantPopoutPage from './pages/AIAssistantPopoutPage';

// Add route inside <Routes>
<Route path="/popout" element={<AIAssistantPopoutPage />} />
```

#### Step 4 — Add "Pop out" button to AIAssistant.tsx

In `AIAssistant.tsx`, add the button to the `HeaderActions` section — only shown when NOT in `fullPage` mode (same guard as collapse/expand/close):

```tsx
// Import at top of file
import { openAIAssistantPopout } from '../utils/aiAssistantPopoutHelper';

// In HeaderActions, before the existing !fullPage && (<> block:
{!fullPage && (
  <PopoutButton
    type="button"
    onClick={openAIAssistantPopout}
    aria-label="Open assistant in new window"
    title="Open in a separate window"
  >
    <span style={{ fontSize: '16px' }}>⊞</span>
  </PopoutButton>
)}
```

Add the styled component near the other header buttons:

```ts
const PopoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }
`;
```

#### Step 5 — Optional: Add `onClose` prop support in `fullPage` mode

In `AIAssistant.tsx`, update the props interface and add a close button visible only in popout:

```tsx
// Add to props interface
onClose?: () => void;

// In ChatHeader, inside the existing !fullPage guard OR a new popout guard:
{fullPage && onClose && (
  <CloseButton
    onClick={onClose}
    aria-label="Close window"
    title="Close this window"
  >
    <span style={{ fontSize: '20px' }}>✕</span>
  </CloseButton>
)}
```

### 3.4 UX Behaviour

| Action | Result |
|---|---|
| Click ⊞ in floating widget header | Opens `/popout` in 900×780 window, centered on screen |
| Click ⊞ again when popout is open | Focuses the existing popout window (no duplicate) |
| Click ✕ inside popout | Calls `window.close()` |
| Resize popout window | `fullPage` CSS fills the window naturally |
| Close main window | Popout stays alive independently |

### 3.5 Vite Config Note

The popout page lives at `/popout` which is a client-side route. Vite's dev server already handles this via `historyApiFallback`. For production builds, ensure the static server (or Express) serves `index.html` for all routes under the AIAssistant origin. If using `vite build`, set:

```ts
// AIAssistant/vite.config.ts — verify this is present
export default defineConfig({
  // ...
  server: {
    historyApiFallback: true,   // dev
  },
  preview: {
    // Add Express handler for production preview:
    // app.get('*', (_, res) => res.sendFile('dist/index.html'))
  },
});
```

---

## 4. Quick Wins Summary (Effort vs. Impact)

| # | Feature | Effort | Impact |
|---|---|---|---|
| 1 | **Popout window** | 2-3h | ⭐⭐⭐⭐⭐ |
| 2 | **Persist toggle state** | 15min | ⭐⭐⭐⭐ |
| 3 | **Conversation persistence** (localStorage) | 30min | ⭐⭐⭐⭐⭐ |
| 4 | **Retry button on error messages** | 1h | ⭐⭐⭐ |
| 5 | **Message copy to clipboard** | 1h | ⭐⭐⭐⭐ |
| 6 | **Export conversation as Markdown** | 1h | ⭐⭐⭐ |
| 7 | **Multi-line textarea input** | 1-2h | ⭐⭐⭐ |
| 8 | **Streaming Groq responses** | 2-3h | ⭐⭐⭐⭐⭐ |
| 9 | **Dynamic knowledge base JSON** | 2-3h | ⭐⭐⭐ |
| 10 | **Brave result Groq summarization** | 1h | ⭐⭐⭐ |
| 11 | **Component decomposition** | 3-4h | ⭐⭐ (dev experience) |
| 12 | **Topic-aware context trimming** | 3-4h | ⭐⭐⭐⭐ |

---

## 5. Recommended Phased Rollout

### Phase 1 — This sprint (Quick wins, ~4 hours total)
- [ ] Popout window (Section 3)
- [ ] Persist toggle state (2.10)
- [ ] Conversation persistence to localStorage (2.3)
- [ ] Retry button on error messages (2.7)

### Phase 2 — Next sprint (Richer UX, ~6 hours total)
- [ ] Message copy + export conversation (2.4)
- [ ] Streaming Groq responses (2.2)
- [ ] Multi-line textarea input (2.8)

### Phase 3 — Future (Architecture, ~8 hours total)
- [ ] Dynamic knowledge base (2.5)
- [ ] Brave result summarization (2.11)
- [ ] Topic-aware context trimming (2.6)
- [ ] Component decomposition (2.9)

---

## 6. Appendix — Current File Inventory

```
AIAssistant/src/
├── components/
│   ├── AIAssistant.tsx         1890 lines  ← main component (oversized)
│   ├── ApiKeyConfiguration.tsx  437 lines
│   └── OAuthLoginPanel.tsx      724 lines
├── services/
│   ├── aiAgentService.ts       1019 lines  ← static knowledge base
│   ├── apiKeyService.ts         ~80 lines
│   ├── groqService.ts            69 lines
│   ├── mcpQueryService.ts       187 lines
│   └── unifiedWorkerTokenService.ts  ~150 lines
├── hooks/
│   └── (hook files)
├── utils/
│   └── (utility files)
└── App.tsx                      353 lines  ← router + page shells
```

Total: ~5,000 lines across 18 files.
