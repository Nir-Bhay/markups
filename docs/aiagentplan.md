# AI Writing Agent - Smart Markdown Generation - Implementation Plan

## Overview

Add an AI-powered writing assistant to Markups that works **exclusively in the editor/writing section**. Users provide their own API key (stored locally in browser). Supports OpenAI, Anthropic, Ollama, and any OpenAI-compatible API. Privacy-first: no data sent to any server except the API endpoint the user configures.

---

## Architecture Summary

Following the existing codebase patterns:
- **Singleton Manager class** (`AIWriterManager`) + EventBus integration
- **4 new files** in `src/features/ai-writer/`
- **Modifications** to 4 existing files (eventBus, storage keys, app config, app.js)
- **1 new HTML container** added to `index.html`
- **All CSS injected via JS** (same pattern as `modal/index.js`)

---

## New Files to Create

### 1. `src/features/ai-writer/system-prompt.js` — The AI Agent's Brain

This is the **core differentiator**. A strong, detailed system prompt that makes the AI agent a **markdown-only writing specialist** scoped to the Markups editor.

```js
export const SYSTEM_PROMPT = `You are **MarkupsAI** — a specialized Markdown writing assistant embedded inside the Markups editor (https://markups.vercel.app/).

## YOUR IDENTITY & SCOPE
- You are a **Markdown writing expert**. You ONLY produce valid Markdown output.
- You operate EXCLUSIVELY within the Markups editor's writing section.
- You NEVER answer general knowledge questions, write code for programming tasks, debug software, or perform tasks outside Markdown document writing.
- If asked to do something outside your scope, respond: "I'm MarkupsAI, a Markdown writing assistant. I can help you write, edit, improve, and format Markdown documents. Please ask me something related to your document."

## YOUR CAPABILITIES
You can:
1. **Generate** — Write complete Markdown documents from a topic/prompt
2. **Continue** — Continue writing from where the user left off, matching their style and tone
3. **Edit/Rewrite** — Improve selected text for clarity, grammar, tone, or structure
4. **Summarize** — Create concise summaries of selected content
5. **Expand** — Elaborate on brief points with more detail
6. **Format** — Convert unstructured text into well-formatted Markdown

## MARKDOWN FEATURES YOU KNOW
The Markups editor supports ALL of these — use them when appropriate:
- **Standard Markdown**: Headings (# to ######), bold, italic, strikethrough, lists (ordered, unordered, task lists), links, images, blockquotes, horizontal rules, tables
- **Code Blocks**: Fenced code blocks with language identifiers (e.g., \`\`\`javascript). The editor supports syntax highlighting for: javascript, typescript, python, java, c, cpp, csharp, go, rust, ruby, php, swift, kotlin, html, css, sql, bash, json, yaml, xml, markdown
- **KaTeX Math**: Inline math with $...$ and display math with $$...$$
  Example: $E = mc^2$ or $$\\int_0^\\infty e^{-x} dx = 1$$
- **Mermaid Diagrams**: Fenced code blocks with \`\`\`mermaid for flowcharts, sequence diagrams, gantt charts, pie charts, class diagrams, state diagrams, ER diagrams, git graphs
- **GitHub-Flavored Markdown (GFM)**:
  - Tables with alignment (|:---|:---:|---:|)
  - Task lists (- [ ] / - [x])
  - Strikethrough (~~text~~)
  - Autolinked URLs
- **GitHub Alerts**: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
  Format: > [!NOTE]\\n> Content here
- **Footnotes**: Reference[^1] and [^1]: Definition
- **Heading IDs**: Auto-generated for table of contents navigation

## OUTPUT RULES
1. **Always output raw Markdown** — never wrap your entire response in a code block unless asked
2. **Match the user's document style** — if they use ATX headings, you use ATX headings; if they write casually, you write casually
3. **Preserve existing formatting** — when editing selected text, maintain the surrounding document's conventions
4. **Use appropriate heading levels** — respect the document's heading hierarchy (don't jump from ## to ####)
5. **Be concise by default** — don't add unnecessary filler. Quality > quantity
6. **Tables must be properly aligned** — always format table columns neatly
7. **Code blocks must specify language** — always include the language identifier
8. **Never output HTML tags** — use only Markdown syntax (the editor sanitizes HTML via DOMPurify)

## CONTEXT AWARENESS
- When given the full document content, understand the document's purpose, structure, and tone before responding
- When continuing text, read the last few paragraphs to match voice, tense, and style
- When given a selection, understand what comes before and after to maintain coherence
- Respect the document's existing heading hierarchy and structure

## LANGUAGE
- Respond in the SAME LANGUAGE as the user's prompt and document
- If the document is in Spanish but the user asks in English, write content in Spanish (matching the document)
- Support all languages for content generation`;

export const ACTION_PROMPTS = {
    generate: (userPrompt, docContext) => {
        let prompt = \`Generate a Markdown document based on this request:\n\n\${userPrompt}\`;
        if (docContext) {
            prompt += \`\n\n---\nCurrent document context (for reference, to match style):\n\${docContext.substring(0, 2000)}\`;
        }
        return prompt;
    },

    continue: (docContent, cursorPosition) => {
        const contextBefore = docContent.substring(Math.max(0, cursorPosition - 3000), cursorPosition);
        const contextAfter = docContent.substring(cursorPosition, cursorPosition + 500);
        return \`Continue writing this Markdown document from where it left off. Match the existing style, tone, and structure.\n\nContent before cursor:\n\${contextBefore}\n\n${contextAfter ? \`Content after cursor:\n\${contextAfter}\` : '(End of document)'}\n\nContinue naturally from the cursor position:\`;
    },

    edit: (selectedText, instruction) => {
        return \`Rewrite/edit the following selected Markdown text based on this instruction: "\${instruction}"\n\nSelected text:\n\${selectedText}\n\nProvide ONLY the rewritten text, no explanations.\`;
    },

    summarize: (selectedText) => {
        return \`Summarize the following Markdown content concisely. Output as Markdown.\n\nContent:\n\${selectedText}\`;
    },

    expand: (selectedText) => {
        return \`Expand on the following Markdown content with more detail, examples, and explanation. Maintain the same formatting style.\n\nContent:\n\${selectedText}\`;
    },

    improve: (selectedText) => {
        return \`Improve the following Markdown text for better clarity, grammar, readability, and structure. Maintain the same meaning and tone.\n\nText:\n\${selectedText}\n\nProvide ONLY the improved text, no explanations.\`;
    }
};
```

### 2. `src/features/ai-writer/service.js` — AI API Service

Handles all API communication. Supports multiple providers through a unified interface.

**Key design decisions:**
- **OpenAI-compatible as default** — Most LLM APIs (including Ollama, LM Studio, vLLM, Together AI, Groq) use the OpenAI `/v1/chat/completions` format
- **Anthropic as separate provider** — Different API format, needs separate handler
- **Streaming via `fetch` + `ReadableStream`** — No external SSE library needed, works in all modern browsers
- **AbortController** for cancellation

```
class AIService:
  - constructor(): provider config from localStorage
  - async sendMessage(messages, options): main API call
  - async *streamMessage(messages, options): streaming generator
  - _buildOpenAIRequest(messages, options): format for OpenAI-compatible
  - _buildAnthropicRequest(messages, options): format for Anthropic
  - _parseOpenAIStream(reader): parse SSE chunks from OpenAI format
  - _parseAnthropicStream(reader): parse SSE chunks from Anthropic format
  - async testConnection(): test API key validity
  - abort(): cancel in-flight request
  - getConfig() / setConfig(): read/write settings to localStorage
```

**Provider configurations:**
```
PROVIDERS = {
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com', models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'] },
  ollama: { name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', models: [] },
  custom: { name: 'Custom Endpoint', baseUrl: '', models: [] }
}
```

**Error handling:**
- 401 → "Invalid API key. Please check your key in AI Settings."
- 429 → "Rate limited. Please wait a moment and try again."
- 500/502/503 → "API server error. The service may be temporarily unavailable."
- Network error → "Cannot reach API endpoint. Check your connection and endpoint URL."
- Timeout (30s default) → "Request timed out."

### 3. `src/features/ai-writer/ui.js` — UI Components

All CSS injected via JS (same pattern as `modal/index.js`). No new CSS files.

**UI Components:**

**A. AI Panel** (slides from right side of editor pane):
- Chat-like input with prompt textarea
- Action buttons row: Generate | Continue | Edit | Summarize | Expand | Improve
- Streaming output area (shows markdown being generated in real-time)
- "Insert into Editor" / "Replace Selection" / "Insert at Cursor" buttons
- Stop generation button (while streaming)
- Settings gear icon to open settings

**B. AI Settings Modal** (uses existing `modal` system):
- Provider dropdown (OpenAI / Anthropic / Ollama / Custom)
- API Key input (password field, stored in localStorage)
- API Endpoint URL (auto-filled from provider, editable)
- Model input (dropdown for known providers, free text for custom)
- Temperature slider (0.0 - 1.0, default 0.7)
- Max tokens input (default 2048)
- "Test Connection" button with status indicator
- "Save" / "Cancel" buttons

**C. Toolbar Integration:**
- New AI button added to the toolbar's Tools group
- Sparkle/wand icon (SVG)
- Title: "AI Writing Assistant (Ctrl+Shift+A)"

**D. Floating Action Menu** (when text is selected in editor):
- Small floating menu near selection with quick actions: Edit | Improve | Summarize | Expand
- Only appears when text is selected AND AI is configured

### 4. `src/features/ai-writer/index.js` — Main Manager

```
class AIWriterManager:
  constructor():
    - this.aiService = new AIService()
    - this.ui = null
    - this.isGenerating = false
    - this.initialized = false

  initialize():
    - Check FEATURE_FLAGS.ENABLE_AI_WRITER
    - Initialize UI
    - Register keyboard shortcut (Ctrl+Shift+A → toggle panel)
    - Listen to EVENTS.SELECTION_CHANGED for floating action menu
    - Listen to AI events from eventBus

  toggle(): show/hide AI panel

  async generate(prompt): full document generation
  async continueWriting(): continue from cursor
  async editSelection(instruction): edit selected text
  async summarize(): summarize selection
  async expand(): expand selection
  async improve(): improve selection

  _insertResult(text, mode): 'insert' | 'replace' | 'append'
    - Uses editorService.insertText() or editorService.replaceRange()

  _getCurrentContext():
    - Returns { fullContent, selectedText, cursorOffset, beforeCursor, afterCursor }
    - Used to build context-aware prompts

  stopGeneration(): abort in-flight request
  openSettings(): open settings modal

  dispose(): cleanup
```

---

## Existing Files to Modify

### 5. `src/utils/eventBus.js` — Add AI Events

Add to EVENTS object:
```js
// AI Writer events
AI_PANEL_TOGGLED: 'ai:panel-toggled',
AI_GENERATION_STARTED: 'ai:generation-started',
AI_GENERATION_STREAMING: 'ai:generation-streaming',
AI_GENERATION_COMPLETE: 'ai:generation-complete',
AI_GENERATION_ERROR: 'ai:generation-error',
AI_GENERATION_CANCELLED: 'ai:generation-cancelled',
AI_SETTINGS_CHANGED: 'ai:settings-changed',
AI_RESULT_INSERTED: 'ai:result-inserted',
```

### 6. `src/core/storage/keys.js` — Add AI Storage Keys

Add to STORAGE_KEYS:
```js
// AI Writer
AI_API_KEY: 'ai_api_key',
AI_PROVIDER: 'ai_provider',
AI_ENDPOINT: 'ai_endpoint',
AI_MODEL: 'ai_model',
AI_TEMPERATURE: 'ai_temperature',
AI_MAX_TOKENS: 'ai_max_tokens',
AI_PANEL_VISIBLE: 'ai_panel_visible',
```

Add to STORAGE_DEFAULTS:
```js
[STORAGE_KEYS.AI_PROVIDER]: 'openai',
[STORAGE_KEYS.AI_ENDPOINT]: 'https://api.openai.com/v1',
[STORAGE_KEYS.AI_MODEL]: 'gpt-4o-mini',
[STORAGE_KEYS.AI_TEMPERATURE]: 0.7,
[STORAGE_KEYS.AI_MAX_TOKENS]: 2048,
[STORAGE_KEYS.AI_PANEL_VISIBLE]: false,
```

**Note**: AI_API_KEY is stored directly in localStorage (not through StorageService namespace) because it needs extra handling — it should NOT be included in any export/backup of settings.

### 7. `src/config/app.config.js` — Add Feature Flag

Add to FEATURE_FLAGS:
```js
ENABLE_AI_WRITER: true,
```

Add to APP_CONFIG:
```js
// AI Writer
AI_REQUEST_TIMEOUT_MS: 30000,
AI_MAX_CONTEXT_CHARS: 8000,
AI_STREAMING_DEBOUNCE_MS: 50,
```

### 8. `src/app.js` — Import and Initialize AIWriterManager

- Import `aiWriterManager` from `./features/ai-writer/index.js`
- Add initialization in `_initFeatures()` after existing features:
  ```js
  if (FEATURE_FLAGS.ENABLE_AI_WRITER) {
      aiWriterManager.initialize();
  }
  ```
- Add `'toggleAI': () => aiWriterManager.toggle()` to shortcut handlers
- Add `aiWriterManager.dispose()` to dispose()

### 9. `index.html` — Add AI Panel Container and Toolbar Button

- Add AI panel container inside the editor pane section (`#edit`):
  ```html
  <!-- AI Writer Panel -->
  <div class="ai-writer-panel" id="ai-writer-panel" style="display:none;">
      <!-- Rendered by JS -->
  </div>
  ```
- Add AI button to toolbar Tools group (after the emoji button):
  ```html
  <!-- AI Writer -->
  <button class="toolbar-btn" id="ai-writer-button" title="AI Writing Assistant (Ctrl+Shift+A)" aria-label="AI Writing Assistant">
      <svg><!-- sparkle icon --></svg>
  </button>
  ```

---

## Implementation Order

### Phase 1: Foundation (High Priority)
1. Create `src/features/ai-writer/system-prompt.js` — System prompt and action prompts
2. Create `src/features/ai-writer/service.js` — AI API service with streaming
3. Modify `src/core/storage/keys.js` — Add storage keys
4. Modify `src/config/app.config.js` — Add feature flag and config
5. Modify `src/utils/eventBus.js` — Add AI events

### Phase 2: UI & Integration (High Priority)
6. Create `src/features/ai-writer/ui.js` — All UI components (panel, settings modal, floating actions)
7. Create `src/features/ai-writer/index.js` — Main manager class
8. Modify `index.html` — Add HTML containers and toolbar button
9. Modify `src/app.js` — Import and wire up the manager

### Phase 3: Polish (Medium Priority)
10. Streaming output rendering with proper markdown preview
11. Error handling refinement and user-friendly messages
12. Mobile responsive UI for the AI panel
13. Keyboard shortcut registration (Ctrl+Shift+A)

---

## Security Considerations

1. **API Key Storage**: Stored in localStorage, never logged, never sent anywhere except the configured API endpoint
2. **XSS Prevention**: AI-generated markdown goes through the existing DOMPurify sanitization pipeline before preview
3. **No Server-Side**: Zero backend — everything runs in browser
4. **Content Security**: System prompt prevents the AI from outputting HTML/scripts
5. **API Key Display**: Masked in UI (show only last 4 chars), password input type

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS approach | Injected via JS | Matches `modal/index.js` pattern, no new CSS files |
| API format | OpenAI-compatible default | 90%+ of LLM APIs support this format |
| Streaming | `fetch` + `ReadableStream` | No external library needed, modern browser native |
| Panel location | Right side of editor pane | AI works only in writing section per requirement |
| System prompt storage | Hardcoded in module | Not user-editable (prevents scope creep of AI) |
| State management | Singleton + EventBus | Matches all existing features |
