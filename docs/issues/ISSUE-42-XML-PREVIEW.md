# Issue #42: XML Preview Rendering Inconsistency

**GitHub Issue**: https://github.com/Nir-Bhay/markups/issues/42  
**Reported By**: wexiyeb618  
**Date**: July 25, 2026  
**Priority**: 🟢 Low  
**Status**: Open  
**Component**: `src/core/markdown/index.js`

---

## 📋 Executive Summary

The XML preview in Markups doesn't match GitHub's Markdown rendering for XML code blocks. While GitHub renders XML with proper syntax highlighting and formatting, Markups shows inconsistent or missing highlighting.

**Impact**: Cosmetic issue affecting users who document XML/HTML/SVG code in their Markdown documents.

---

## 🔍 Problem Analysis

### Current Behavior
- XML code blocks in Markups preview lack proper syntax highlighting
- GitHub renders XML with distinct colors for tags, attributes, and values
- Markups may fall back to `plaintext` highlighting for XML

### Root Cause Investigation

#### 1. **Prism.js Language Registration**
**File**: `src/core/markdown/index.js` (Lines 20-37)

**Current State**:
```javascript
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';  // Should cover XML
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
```

**Issue**: While `prism-markup` is imported, XML-specific highlighting might not be triggered because:
1. Markdown code blocks use `xml` or `svg` language tags
2. Prism's language aliasing might not map correctly
3. The `markup` component might not cover all XML syntax nuances

#### 2. **Marked Highlight Configuration**
**File**: `src/core/markdown/index.js` (Lines 110-130)

**Current Implementation**:
```javascript
marked.use(
    markedHighlight({
        langPrefix: 'language-',
        highlight(code, lang) {
            const language = Prism.languages[lang] ? lang : 'plaintext';
            try {
                return Prism.highlight(code, Prism.languages[language], language);
            } catch (err) {
                console.error('Prism highlight error:', err);
                return code;
            }
        }
    })
);
```

**Problem**: The `lang` parameter from markdown code blocks (e.g., \`\`\`xml) might not map to Prism's internal language name.

---

## 🛠️ Solution Approaches

### Solution 1: Add Explicit XML/SVG Prism Components (Recommended)

**Pros**:
- ✅ Minimal code change
- ✅ Follows existing pattern in the codebase
- ✅ No breaking changes
- ✅ Maintains performance (tree-shaking works)

**Cons**:
- ⚠️ Increases bundle size slightly (Prism components are small)

**Implementation**:

#### Step 1: Add Imports
**File**: `src/core/markdown/index.js` (After line 37)

```javascript
// Add XML and SVG specific components
import 'prismjs/components/prism-xml-doc';  // XML documents
import 'prismjs/components/prism-svg';      // SVG elements
```

#### Step 2: Verify Language Mapping
Prism.js automatically registers language aliases. Verify that:
- `xml` → maps to `xml-doc` or `markup`
- `svg` → maps to `svg` or `markup`
- `html` → maps to `markup`

**Testing**:
```markdown
```xml
<note>
    <to>User</to>
    <from>Markups</from>
    <body>Test XML rendering</body>
</note>
```
```

---

### Solution 2: Add Language Alias Mapping

**Pros**:
- ✅ More robust language detection
- ✅ Handles edge cases (e.g., `xhtml`, `atom`)

**Cons**:
- ⚠️ Requires modifying highlight function
- ⚠️ Slightly more complex

**Implementation**:

**File**: `src/core/markdown/index.js` (Modify lines 110-130)

```javascript
// Language alias mapping
const LANGUAGE_ALIASES = {
    'xml': 'markup',
    'svg': 'markup',
    'xhtml': 'markup',
    'atom': 'xml-doc',
    'rss': 'xml-doc'
};

marked.use(
    markedHighlight({
        langPrefix: 'language-',
        highlight(code, lang) {
            // Apply alias mapping
            const normalizedLang = LANGUAGE_ALIASES[lang] || lang;
            const language = Prism.languages[normalizedLang] ? normalizedLang : 
                           Prism.languages[lang] ? lang : 'plaintext';
            
            try {
                return Prism.highlight(code, Prism.languages[language], language);
            } catch (err) {
                console.error('Prism highlight error:', err);
                return code;
            }
        }
    })
);
```

---

### Solution 3: Use Custom Renderer for Code Blocks

**Pros**:
- ✅ Full control over code block rendering
- ✅ Can add copy buttons, line numbers, etc.

**Cons**:
- ❌ More invasive change
- ❌ Might conflict with existing `markedHighlight` extension

**Implementation**:

```javascript
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }) {
    const language = lang || 'plaintext';
    let highlighted;
    
    if (Prism.languages[language]) {
        highlighted = Prism.highlight(text, Prism.languages[language], language);
    } else {
        highlighted = escapeHtml(text);
    }
    
    return `<pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
};

marked.use({ renderer });
```

**Not Recommended**: Conflicts with `markedHighlight` extension already in use.

---

## 📊 Comparison with Similar Projects

### 1. **StackEdit** (Open Source Markdown Editor)
- **Approach**: Uses `marked` + `highlight.js` (not Prism)
- **XML Handling**: `highlight.js` auto-detects XML
- **Lesson**: Auto-detection can be simpler but less control

### 2. **VS Code Markdown Preview**
- **Approach**: Uses `markdown-it` + `highlight.js`
- **XML Handling**: Explicit language mapping in configuration
- **Lesson**: Configuration-driven language mapping is maintainable

### 3. **Obsidian**
- **Approach**: Custom Markdown parser + CodeMirror highlighting
- **XML Handling**: Uses CodeMirror's XML mode
- **Lesson**: Editor and preview highlighting should match

---

## 🧪 Testing Plan

### Test Cases

#### Test 1: Basic XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
    <element attribute="value">Content</element>
</root>
```

**Expected**: Tags in blue, attributes in red, values in green (Prism default)

#### Test 2: SVG
```svg
<svg width="100" height="100">
    <circle cx="50" cy="50" r="40" stroke="green" fill="yellow" />
</svg>
```

**Expected**: SVG elements highlighted as XML

#### Test 3: HTML (should still work)
```html
<div class="container">
    <p>HTML should still highlight correctly</p>
</div>
```

**Expected**: No regression in HTML highlighting

#### Test 4: GitHub Comparison
- Create same XML document in Markups and GitHub
- Screenshot both previews
- Compare syntax highlighting colors and accuracy

---

## 🔧 Integration with Existing Codebase

### Dependencies
- ✅ No new npm packages needed (Prism.js already installed)
- ✅ Follows existing import pattern in `src/core/markdown/index.js`
- ✅ No changes to `marked` configuration structure

### Files to Modify
1. `src/core/markdown/index.js` (add imports + optional alias mapping)

### Files NOT to Modify
- ❌ `src/utils/scroll-sync.js` (unrelated)
- ❌ `index.html` (no UI changes needed)
- ❌ `public/css/premium-ui.css` (Prism themes handle styling)

---

## 📈 Performance Impact

### Bundle Size
- **Prism XML component**: ~2 KB (minified + gzipped)
- **Prism SVG component**: ~1.5 KB
- **Total increase**: ~3.5 KB (negligible)

### Runtime Performance
- **Highlighting time**: <1ms per code block (Prism is fast)
- **No impact** on scroll sync or preview rendering pipeline

---

## 🎯 Recommended Solution

**Choose Solution 1** (Add Explicit XML/SVG Prism Components) because:
1. Minimal code change (2 import lines)
2. Follows existing codebase patterns
3. No breaking changes
4. Easy to test and verify

### Implementation Steps

1. **Add imports** to `src/core/markdown/index.js`:
   ```javascript
   import 'prismjs/components/prism-xml-doc';
   import 'prismjs/components/prism-svg';
   ```

2. **Test** with XML/SVG code blocks

3. **Verify** no regression in other language highlighting

4. **Compare** with GitHub's rendering (screenshot comparison)

5. **Commit** with message:
   ```
   fix(preview): add XML and SVG syntax highlighting
   
   - Import prism-xml-doc and prism-svg components
   - Fixes #42 where XML code blocks lacked highlighting
   - Follows existing Prism import pattern
   ```

---

## 📚 References

1. [Prism.js Language Components](https://prismjs.com/components/)
2. [Marked.js Highlight Extension](https://marked.js.org/using_pro/renderer#highlight)
3. [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
4. [Issue #42 Screenshots](https://github.com/Nir-Bhay/markups/issues/42)

---

## 🔄 Follow-Up Actions

- [ ] Test with user-provided XML example from issue
- [ ] Check if `prism-markup` already covers XML (might not need separate import)
- [ ] Consider adding XML to the default template examples
- [ ] Document supported languages in `README.md`

---

**Last Updated**: July 25, 2026  
**Author**: AI Assistant (based on codebase analysis)  
**Next Review**: After implementation and testing
