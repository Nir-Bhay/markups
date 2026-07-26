# Issue #39: Improve Sync Scrolling for Long Pages

**GitHub Issue**: https://github.com/Nir-Bhay/markups/issues/39  
**Reported By**: wexiyeb618  
**Date**: July 9, 2026  
**Priority**: 🔴 High  
**Status**: Open  
**Component**: `src/utils/scroll-sync.js`, `src/main.js`

---

## 📋 Executive Summary

The scroll synchronization between editor and preview drifts on long documents, causing the preview to show different content than the editor. This breaks the core "what you see is what you type" experience.

**Impact**: Core functionality broken for long documents (>1000 lines). Users lose trust in the preview accuracy.

---

## 🔍 Problem Analysis

### Current Behavior
1. User scrolls in editor
2. Preview scrolls proportionally
3. After several scrolls, editor and preview content don't match
4. Drift worsens with document length

### Root Cause Investigation

#### 1. **Proportional Scrolling is Inaccurate**
**File**: `src/utils/scroll-sync.js` (Lines 100-150)

**Current Implementation**:
```javascript
syncEditorToPreview() {
    const scrollTop = this.editor.getScrollTop();
    const scrollHeight = this.editor.getScrollHeight();
    const viewportHeight = this.editor.getLayoutInfo().height;
    
    // Calculate scroll ratio (0 to 1)
    const maxScrollTop = Math.max(0, scrollHeight - viewportHeight);
    const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
    
    // Apply ratio to preview
    const previewMaxScroll = Math.max(0, this.preview.scrollHeight - this.preview.clientHeight);
    const targetY = previewMaxScroll * scrollRatio;
    
    this.preview.scrollTop = targetY;
}
```

**Problem**:
- Assumes editor and preview have **linear height relationship**
- Doesn't account for:
  - Headings, code blocks, images (different heights in preview)
  - Line wrapping in editor vs. fixed preview layout
  - Monaco's virtualized rendering (not all lines have same height)

**Mathematical Proof of Drift**:
```
Editor: 1000 lines × 20px/line = 20,000px height
Preview: 1000 lines → 25,000px height (headings, code blocks add height)

Scroll editor to line 500 (50%):
  Editor scrollRatio = 500/1000 = 0.5
  Preview targetY = 25,000 × 0.5 = 12,500px
  But line 500 might actually be at 10,000px in preview!
  
→ Drift = 2,500px (10% of preview height)
```

#### 2. **No Line-to-Element Mapping**
The current implementation doesn't know which preview element corresponds to which editor line.

**Missing Feature**:
- No mapping between Monaco editor lines and preview DOM elements
- Can't scroll to "the element that corresponds to line 500"

#### 3. **Monaco Editor Complexity**
Monaco doesn't expose a simple "line to pixel position" API for the preview side.

**Challenge**:
- Monaco uses virtualized rendering (only visible lines in DOM)
- Line heights can vary (word wrap, font size changes)
- No built-in "getLineTopPosition()" that maps to preview

---

## 🛠️ Solution Approaches

### Solution 1: Line-Based Scroll Sync with Heading Anchors (Recommended)

**Pros**:
- ✅ Accurate for documents with headings
- ✅ Works with existing heading ID system (`gfmHeadingId`)
- ✅ No complex line-by-line mapping needed
- ✅ Fast (only check headings, not every line)

**Cons**:
- ⚠️ Less accurate for documents without headings
- ⚠️ Requires heading parsing on every scroll (debounced)

**Implementation**:

#### Step 1: Modify Scroll Sync Logic
**File**: `src/utils/scroll-sync.js`

```javascript
class ScrollSync {
    constructor() {
        this.enabled = false;
        this.isSyncing = false;
        this.editor = null;
        this.preview = null;
        this.headingMap = [];  // Cache: [{line, element, previewTop}]
        this.scrollTimeout = null;
    }
    
    // Build heading map (call on content change)
    buildHeadingMap() {
        if (!this.editor || !this.preview) return;
        
        const content = this.editor.getValue();
        const lines = content.split('\n');
        this.headingMap = [];
        
        // Find headings in editor
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                const headingText = match[2];
                const id = headingText.toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');
                
                // Find corresponding preview element
                const previewElement = this.preview.querySelector(`#${id}`);
                if (previewElement) {
                    this.headingMap.push({
                        line: i + 1,
                        element: previewElement,
                        previewTop: previewElement.offsetTop
                    });
                }
            }
        }
        
        // Sort by line number
        this.headingMap.sort((a, b) => a.line - b.line);
    }
    
    // Improved sync: Use heading map
    syncEditorToPreview() {
        if (!this.enabled || this.isSyncing) return;
        
        this.isSyncing = true;
        
        // Get current editor line
        const position = this.editor.getPosition();
        const currentLine = position.lineNumber;
        
        // Find closest heading above current line
        let targetHeading = null;
        for (let i = this.headingMap.length - 1; i >= 0; i--) {
            if (this.headingMap[i].line <= currentLine) {
                targetHeading = this.headingMap[i];
                break;
            }
        }
        
        if (targetHeading) {
            // Scroll preview to this heading
            targetHeading.element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // No heading found: use proportional fallback
            this.proportionalScrollFallback(currentLine);
        }
        
        setTimeout(() => { this.isSyncing = false; }, 50);
    }
    
    // Fallback for documents without headings
    proportionalScrollFallback(currentLine) {
        const totalLines = this.editor.getModel().getLineCount();
        const lineRatio = currentLine / totalLines;
        
        const previewMaxScroll = Math.max(0, this.preview.scrollHeight - this.preview.clientHeight);
        const targetY = previewMaxScroll * lineRatio;
        
        this.preview.scrollTop = targetY;
    }
}
```

#### Step 2: Rebuild Heading Map on Content Change
**File**: `src/main.js` (where scroll sync is initialized)

```javascript
// After preview render
markdownService.render(content, previewElement).then(() => {
    // Rebuild heading map
    scrollSync.buildHeadingMap();
});
```

#### Step 3: Debounce Scroll Events
**File**: `src/utils/scroll-sync.js`

```javascript
setupEventListeners() {
    if (!this.editor || !this.preview) return;
    
    // Debounced editor scroll handler
    const editorScrollHandler = this.editor.onDidScrollChange((e) => {
        if (!this.enabled || this.isSyncing) return;
        
        // Debounce: only sync after user stops scrolling
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.syncEditorToPreview();
        }, 50);  // 50ms debounce
    });
    
    this.cleanupFunctions.push(() => editorScrollHandler.dispose());
}
```

---

### Solution 2: Intersection Observer for Preview-to-Editor Sync

**Pros**:
- ✅ Browser-native, performant
- ✅ Accurate element visibility tracking
- ✅ Works bidirectionally (preview→editor)

**Cons**:
- ⚠️ Requires mapping preview elements back to editor lines
- ⚠️ More complex implementation

**Implementation**:

```javascript
setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        if (this.isSyncing) return;
        
        // Find most visible element
        const visibleEntry = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        
        if (visibleEntry) {
            const previewElement = visibleEntry.target;
            
            // Map preview element back to editor line
            const lineNumber = this.getLineFromPreviewElement(previewElement);
            
            if (lineNumber) {
                // Scroll editor to this line
                this.editor.revealLine(lineNumber);
            }
        }
    }, {
        root: this.preview,
        threshold: 0.5  // 50% visible
    });
    
    // Observe all preview elements that have corresponding editor lines
    this.preview.querySelectorAll('h1, h2, h3, p, pre, code').forEach(el => {
        observer.observe(el);
    });
}

getLineFromPreviewElement(element) {
    // Extract heading ID and reverse-map to line number
    const id = element.id;
    const heading = this.headingMap.find(h => h.element.id === id);
    return heading ? heading.line : null;
}
```

---

### Solution 3: Hybrid Approach with Line Height Cache

**Pros**:
- ✅ Most accurate (line-by-line mapping)
- ✅ Works for all document types

**Cons**:
- ❌ Complex to implement
- ❌ Performance cost of maintaining line height cache
- ❌ Monaco's virtualized rendering makes this difficult

**Implementation** (Conceptual):

```javascript
// Cache editor line positions (expensive)
buildLineHeightCache() {
    const model = this.editor.getModel();
    const lineCount = model.getLineCount();
    this.lineCache = [];
    
    let cumulativeHeight = 0;
    for (let i = 1; i <= lineCount; i++) {
        const lineHeight = this.editor.getOption(monaco.editor.EditorOption.lineHeight);
        this.lineCache.push({
            line: i,
            top: cumulativeHeight
        });
        cumulativeHeight += lineHeight;
    }
}
```

**Not Recommended**: Monaco doesn't expose line positions easily, and caching is fragile.

---

## 📊 Comparison with Similar Projects

### 1. **VS Code Markdown Preview**
- **Approach**: Line-based sync using source map
- **Implementation**: Markdown parser generates source map (line numbers → HTML elements)
- **Accuracy**: High (designed for this use case)
- **Lesson**: Source maps are the gold standard

### 2. **StackEdit**
- **Approach**: Heading-based sync (like Solution 1)
- **Implementation**: Click heading in preview → scroll to line in editor
- **Accuracy**: Medium (good for structured documents)
- **Lesson**: Heading sync is "good enough" for most users

### 3. **Obsidian**
- **Approach**: Live preview (WYSIWYG-like)
- **Implementation**: Editor and preview are the same DOM
- **Accuracy**: Perfect (no sync needed)
- **Lesson**: Different architecture eliminates the problem

### 4. **Typora**
- **Approach**: Live preview (no split pane)
- **Implementation**: What You See Is What You Get
- **Accuracy**: Perfect
- **Lesson**: Single-pane architecture avoids sync issues

---

## 🧪 Testing Plan

### Test Cases

#### Test 1: Long Document with Headings
```markdown
# Introduction
(Lots of text...)

## Chapter 1
(Lots of text...)

## Chapter 2
(Lots of text...)

# Conclusion
```

**Expected**: Scrolling to Chapter 1 in editor → preview scrolls to Chapter 1

#### Test 2: Document Without Headings
```markdown
Paragraph 1
(Lots of text...)

Paragraph 2
(Lots of text...)
```

**Expected**: Falls back to proportional scrolling (less accurate but functional)

#### Test 3: Mixed Content (Headings + Code Blocks + Images)
```markdown
# Title

Some text.

\`\`\`js
const code = "block";
\`\`\`

![Image](image.png)

More text.
```

**Expected**: Scroll sync accounts for different element heights

#### Test 4: Rapid Scrolling
- Scroll editor quickly (mouse wheel / scrollbar drag)
- **Expected**: Preview sync debounced, no lag or jumpiness

#### Test 5: Preview-to-Editor Sync
- Scroll preview manually
- **Expected**: Editor scrolls to corresponding line (if implemented)

---

## 🔧 Integration with Existing Codebase

### Dependencies
- ✅ Uses existing `gfmHeadingId` extension (headings already have IDs)
- ✅ No new npm packages needed
- ✅ Follows existing scroll sync pattern

### Files to Modify
1. `src/utils/scroll-sync.js` (rewrite sync logic)
2. `src/main.js` (rebuild heading map on preview update)

### Files NOT to Modify
- ❌ `src/core/markdown/index.js` (unrelated)
- ❌ `index.html` (no UI changes)
- ❌ Monaco editor configuration (keep as-is)

---

## 📈 Performance Impact

### Heading Map Construction
- **Cost**: ~5-10ms for 1000-line document
- **Frequency**: Only on content change (not on every scroll)
- **Mitigation**: Debounce map rebuild (100ms)

### Scroll Sync
- **Cost**: <1ms per scroll event (just a lookup)
- **Debounce**: 50ms (feels instant to user)
- **No Impact**: on typing or preview rendering

---

## 🎯 Recommended Solution

**Choose Solution 1** (Line-Based Sync with Heading Anchors) because:
1. Most accurate for real-world documents (most have headings)
2. Follows existing architecture (uses `gfmHeadingId`)
3. Performant (only checks headings, not every line)
4. Easier to implement than line-by-line mapping

### Implementation Steps

1. **Add `buildHeadingMap()` method** to `ScrollSync` class
2. **Modify `syncEditorToPreview()`** to use heading map
3. **Add debounced scroll handler** to prevent lag
4. **Rebuild heading map** on preview update
5. **Test** with long documents from issue reporter

### Future Enhancement: Full Source Map
For perfect accuracy, consider:
- Modifying `marked` parser to output source map
- Mapping each HTML element to editor line number
- This is complex but would be the "gold standard"

---

## 📚 References

1. [VS Code Markdown Preview Sync](https://code.visualstudio.com/docs/languages/markdown)
2. [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
3. [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)
4. [Scroll Synchronization Patterns](https://css-tricks.com/scroll-synchronization/)
5. [Issue #39 Video](https://github.com/Nir-Bhay/markups/issues/39)

---

## 🔄 Follow-Up Actions

- [ ] Test with the exact file from issue reporter (Making.an.item.md)
- [ ] Consider adding "Scroll to Current Line" button in preview
- [ ] Add setting to disable scroll sync (some users might prefer independent scrolling)
- [ ] Document scroll sync behavior in user guide
- [ ] Monitor performance with 10,000+ line documents

---

**Last Updated**: July 25, 2026  
**Author**: AI Assistant (based on codebase analysis)  
**Next Review**: After implementation and performance testing
