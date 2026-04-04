# 🔨 Modification Guide: Add a Toolbar Button

> Step-by-step guide for adding a new button to the toolbar

## 📋 Prerequisites

- Understanding of JavaScript ES6
- Basic HTML/CSS knowledge
- Familiarity with Monaco Editor API (optional)

---

## 🎯 What You'll Create

A new toolbar button that performs a custom action (e.g., insert emoji, format code, add quote, etc.)

---

## 📝 Step-by-Step Guide

### Step 1: Add HTML Button

**File**: `index.html`
**Location**: Lines 350-550 (inside `<div id="toolbar" class="premium-toolbar">`)

Find an appropriate `<div class="toolbar-group">` or create a new one:

```html
<!-- Add this inside a toolbar-group div around line 420 -->
<button class="toolbar-btn" 
        id="toolbar-my-action" 
        title="My Custom Action" 
        aria-label="My Custom Action">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <!-- Replace with your icon path -->
    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
    <path d="M2 17l10 5 10-5"></path>
    <path d="M2 12l10 5 10-5"></path>
  </svg>
</button>
```

**Icon Sources**:
- [Heroicons](https://heroicons.com/)
- [Feather Icons](https://feathericons.com/)
- [Lucide](https://lucide.dev/)

---

### Step 2: Add JavaScript Handler

**Option A: Add to Toolbar Feature**

**File**: `src/features/toolbar/index.js`
**Location**: Around lines 250-300 (event listeners section)

```javascript
// Add this in the initToolbar() function
document.getElementById('toolbar-my-action').addEventListener('click', () => {
  handleMyAction();
});

// Add this function at the end of the file
function handleMyAction() {
  const editor = window.editor; // Monaco editor instance
  const selection = editor.getSelection();
  const selectedText = editor.getModel().getValueInRange(selection);
  
  // Your custom logic here
  const newText = `✨ ${selectedText} ✨`; // Example: wrap in emoji
  
  editor.executeEdits('my-action', [{
    range: selection,
    text: newText
  }]);
  
  // Optional: Show toast notification
  if (window.toast) {
    toast.success('Action completed!');
  }
}
```

**Option B: Create Dedicated Feature File**

**File**: `src/features/my-action/index.js` (create new)

```javascript
/**
 * My Custom Action Feature
 */

export function initMyAction() {
  const button = document.getElementById('toolbar-my-action');
  if (!button) return;
  
  button.addEventListener('click', handleAction);
}

function handleAction() {
  const editor = window.editor;
  if (!editor) return;
  
  const selection = editor.getSelection();
  const selectedText = editor.getModel().getValueInRange(selection);
  
  // Your logic
  const transformed = transformText(selectedText);
  
  editor.executeEdits('my-action', [{
    range: selection,
    text: transformed
  }]);
}

function transformText(text) {
  // Transform logic
  return text.toUpperCase(); // Example
}

export default { initMyAction };
```

Then import and call in `src/main.js`:

```javascript
// In main.js around line 300
import { initMyAction } from './features/my-action/index.js';

// In initialization section
initMyAction();
```

---

### Step 3: Add CSS Styling (Optional)

**File**: `public/css/premium-ui.css`
**Location**: Around lines 500-550 (toolbar section)

```css
/* Custom styling for your button */
#toolbar-my-action {
  /* Inherits from .toolbar-btn */
}

/* Active state */
#toolbar-my-action.active {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
}

/* Hover effect (override default) */
#toolbar-my-action:hover {
  background: var(--bg-hover);
  color: var(--text-accent);
}
```

---

### Step 4: Add Keyboard Shortcut (Optional)

**File**: `src/services/shortcuts/index.js`
**Location**: Around lines 390-400

```javascript
// Add to initShortcuts() function
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
  handleMyAction(); // Your function from toolbar
});
```

**Common Key Combinations**:
- `KeyMod.CtrlCmd | KeyCode.KeyX` - Ctrl/Cmd + X
- `KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyX` - Ctrl/Cmd + Shift + X
- `KeyMod.Alt | KeyCode.KeyX` - Alt + X

---

## 🎨 Example: Add "Quote" Button

Complete example that wraps selected text in a blockquote:

### HTML (index.html):
```html
<button class="toolbar-btn" id="toolbar-quote" title="Blockquote (Ctrl+Q)" aria-label="Add blockquote">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
  </svg>
</button>
```

### JavaScript (src/features/toolbar/index.js):
```javascript
// Event listener
document.getElementById('toolbar-quote').addEventListener('click', () => {
  insertQuote();
});

// Function
function insertQuote() {
  const editor = window.editor;
  const selection = editor.getSelection();
  const selectedText = editor.getModel().getValueInRange(selection);
  
  let quotedText;
  if (selectedText) {
    // Quote selected text
    const lines = selectedText.split('\n');
    quotedText = lines.map(line => `> ${line}`).join('\n');
  } else {
    // Insert empty quote at cursor
    quotedText = '> ';
  }
  
  editor.executeEdits('insert-quote', [{
    range: selection,
    text: quotedText
  }]);
  
  // Move cursor to end
  const newPosition = editor.getPosition();
  editor.setPosition(newPosition);
  editor.focus();
}

// Keyboard shortcut (in shortcuts/index.js)
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyQ, () => {
  insertQuote();
});
```

---

## 📱 Mobile Considerations

For mobile devices, buttons might overflow into the overflow menu.

**File**: `index.html` (around lines 6104-6174)

Add to overflow sheet:

```html
<div class="toolbar-overflow-sheet" id="toolbar-overflow-sheet">
  <div class="toolbar-overflow-grid">
    <!-- Add your button here too for mobile -->
    <button class="toolbar-overflow-item" data-action="my-action">
      <svg>...</svg>
      <span>My Action</span>
    </button>
  </div>
</div>
```

Handle click:

```javascript
document.querySelectorAll('[data-action="my-action"]').forEach(btn => {
  btn.addEventListener('click', handleMyAction);
});
```

---

## ✅ Testing Checklist

- [ ] Button appears in toolbar
- [ ] Icon displays correctly
- [ ] Click triggers correct action
- [ ] Works with selected text
- [ ] Works without selection
- [ ] Keyboard shortcut works (if added)
- [ ] Mobile responsive
- [ ] Tooltip shows on hover
- [ ] Dark mode styling looks good

---

## 🐛 Common Issues

### Button doesn't appear
- Check if ID is unique
- Verify HTML is inside `<div id="toolbar">`
- Clear browser cache

### Click does nothing
- Check console for errors
- Verify event listener is attached
- Ensure editor instance exists (`window.editor`)

### Icon not showing
- Verify SVG path is correct
- Check stroke/fill attributes
- Test with a simple shape first

### Keyboard shortcut conflicts
- Check existing shortcuts in `shortcuts/index.js`
- Use combination that's not taken
- Test in both light and dark mode

---

## 🔗 Related Documentation

- **Toolbar Feature**: `AI-DOCS/features/toolbar.md`
- **Keyboard Shortcuts**: `AI-DOCS/features/shortcuts.md`
- **Monaco Editor API**: [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/docs.html)

---

## 📚 More Examples

### Example: Insert Emoji
```javascript
function insertEmoji(emoji) {
  const editor = window.editor;
  const position = editor.getPosition();
  editor.executeEdits('insert-emoji', [{
    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
    text: emoji
  }]);
}
```

### Example: Toggle Format
```javascript
function toggleBold() {
  const editor = window.editor;
  const selection = editor.getSelection();
  const selectedText = editor.getModel().getValueInRange(selection);
  
  // Check if already bold
  const isBold = selectedText.startsWith('**') && selectedText.endsWith('**');
  
  const newText = isBold 
    ? selectedText.slice(2, -2) 
    : `**${selectedText}**`;
  
  editor.executeEdits('toggle-bold', [{
    range: selection,
    text: newText
  }]);
}
```

### Example: Insert at Cursor
```javascript
function insertAtCursor(text) {
  const editor = window.editor;
  const position = editor.getPosition();
  const range = new monaco.Range(
    position.lineNumber, 
    position.column, 
    position.lineNumber, 
    position.column
  );
  
  editor.executeEdits('insert-text', [{
    range: range,
    text: text
  }]);
}
```

---

**Last Updated**: 2026-04-04
