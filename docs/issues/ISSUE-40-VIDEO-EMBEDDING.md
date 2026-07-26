# Issue #40: Video Embedding in Preview

**GitHub Issue**: https://github.com/Nir-Bhay/markups/issues/40  
**Reported By**: wexiyeb618  
**Date**: July 9, 2026  
**Priority**: 🟡 Medium  
**Status**: Open  
**Component**: `src/core/markdown/index.js`, `src/core/markdown/extensions/video.js` (new)

---

## 📋 Executive Summary

Users want to see videos embedded directly in the Markdown preview instead of clickable links. GitHub supports video attachments and renders them as playable `<video>` elements. Markups currently shows video URLs as plain links.

**Impact**: Users documenting video content (tutorials, demos, screen recordings) have poor experience.

---

## 🔍 Problem Analysis

### Current Behavior
1. Video URLs (e.g., GitHub video attachments) render as clickable links
2. No `<video>` element is created in the preview
3. Users must click link to open video in new tab

### Desired Behavior
1. Video URLs should render as embedded `<video>` players
2. GitHub video attachments should work similarly to GitHub's rendering
3. Support common video formats (MP4, WebM, OGG)

### Root Cause Investigation

#### 1. **No Video Detection in Markdown Parser**
**File**: `src/core/markdown/index.js`

**Current State**:
- Markdown parser treats video URLs as regular links
- No custom extension for video detection
- DOMPurify allows `<video>` tags (line 229), but they're never created

#### 2. **DOMPurify Configuration**
**File**: `src/core/markdown/index.js` (Lines 229-232)

```javascript
sanitize(html) {
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_TAGS: ['iframe', 'math', 'mrow', 'mo', 'mi', 'mn', 'msup', 'mfrac', 'semantics', 'annotation'],
        ADD_ATTR: ['target', 'class', 'id', 'style', 'data-*', 'aria-*', 'frameborder', 'allowfullscreen'],
        ALLOW_DATA_ATTR: true
    });
}
```

**Issue**: `video` tag is NOT in `ADD_TAGS`, but `USE_PROFILES: { html: true }` should allow standard HTML tags including `<video>`.

**Verification Needed**: Test if DOMPurify strips `<video>` tags.

#### 3. **GitHub Video Attachment URLs**
GitHub video attachments use this URL pattern:
```
https://github.com/user-attachments/assets/[UUID]
```

These are **not direct video URLs** - they're HTML pages that contain the video. GitHub's renderer fetches the actual video URL via API or page metadata.

---

## 🛠️ Solution Approaches

### Solution 1: Custom Marked Extension for Video URLs (Recommended)

**Pros**:
- ✅ Integrates with existing Markdown parsing pipeline
- ✅ Supports multiple video URL patterns
- ✅ Configurable and extensible
- ✅ Follows codebase patterns (see `katexExtension` in same file)

**Cons**:
- ⚠️ Requires new code (not just configuration)
- ⚠️ GitHub video attachments need special handling

**Implementation**:

#### Step 1: Create Video Extension
**New File**: `src/core/markdown/extensions/video.js`

```javascript
/**
 * Video Extension for Marked.js
 * Converts video URLs to <video> elements in Markdown preview
 */

export const videoExtension = {
    name: 'video',
    level: 'inline',
    
    // Check if this tokenizer should run
    start(src) {
        // Match video file extensions
        const match = src.match(/https?:\/\/[^\s]+\.(mp4|webm|ogg|mov|avi)/i);
        if (match) return match.index;
        
        // Match GitHub video attachments
        const githubMatch = src.match(/https?:\/\/github\.com\/user-attachments\/assets\/[a-f0-9-]+/i);
        if (githubMatch) return githubMatch.index;
        
        return -1;
    },
    
    // Tokenize video URL
    tokenizer(src) {
        // Direct video file URL
        const directMatch = /^https?:\/\/[^\s]+\.(mp4|webm|ogg|mov|avi)(\?[^\s]*)?/i.exec(src);
        if (directMatch) {
            return {
                type: 'video',
                raw: directMatch[0],
                url: directMatch[0],
                format: directMatch[1].toLowerCase()
            };
        }
        
        // GitHub video attachment
        const githubMatch = /^https?:\/\/github\.com\/user-attachments\/assets\/([a-f0-9-]+)/i.exec(src);
        if (githubMatch) {
            return {
                type: 'githubVideo',
                raw: githubMatch[0],
                id: githubMatch[1]
            };
        }
    },
    
    // Render token to HTML
    renderer(token) {
        if (token.type === 'video') {
            return `
                <div class="video-container">
                    <video controls preload="metadata" style="max-width: 100%; height: auto;">
                        <source src="${token.url}" type="video/${token.format}">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        }
        
        if (token.type === 'githubVideo') {
            // GitHub video attachments need special handling
            // Option 1: Link with thumbnail (simpler)
            // Option 2: Fetch actual video URL via API (complex)
            return `
                <div class="video-attachment">
                    <a href="${token.raw}" target="_blank" rel="noopener noreferrer" class="video-link">
                        <span class="video-icon">🎬</span>
                        <span>View Video Attachment</span>
                    </a>
                </div>
            `;
        }
    }
};
```

#### Step 2: Register Extension
**File**: `src/core/markdown/index.js`

```javascript
// Add import at top
import { videoExtension } from './extensions/video.js';

// Modify marked.use() call (around line 110)
marked.use(
    markedHighlight({...}),
    gfmHeadingId(),
    markedAlert(),
    markedFootnote(),
    {
        extensions: [katexExtension, videoExtension]  // Add videoExtension
    }
);
```

#### Step 3: Add CSS Styling
**File**: `public/css/premium-ui.css` (Add at end)

```css
/* Video container styling */
.video-container {
    margin: 1rem 0;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
}

.video-container video {
    display: block;
    width: 100%;
    max-height: 500px;
}

/* GitHub video attachment styling */
.video-attachment {
    margin: 1rem 0;
    padding: 1rem;
    border: 2px dashed var(--border-color, #e1e4e8);
    border-radius: 8px;
    text-align: center;
    background: var(--bg-secondary, #f6f8fa);
}

.video-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-color, #5865f2);
    text-decoration: none;
    font-weight: 500;
}

.video-link:hover {
    text-decoration: underline;
}

.video-icon {
    font-size: 1.5rem;
}
```

---

### Solution 2: HTML5 Video Tag in Markdown (Simpler, Less Robust)

**Pros**:
- ✅ No JavaScript changes needed
- ✅ Users can use HTML directly in Markdown

**Cons**:
- ❌ Not automatic (users must write HTML)
- ❌ Breaks Markdown portability
- ❌ Doesn't handle GitHub video attachments

**Implementation**: None needed - Markdown supports inline HTML.

**User Workflow**:
```markdown
<!-- User writes this in Markdown -->
<video controls>
    <source src="video.mp4" type="video/mp4">
</video>
```

**Our Role**: Ensure DOMPurify doesn't strip `<video>` tags (already allowed via `USE_PROFILES: { html: true }`).

---

### Solution 3: GitHub Video API Integration (Advanced)

**Pros**:
- ✅ Full support for GitHub video attachments
- ✅ Matches GitHub's behavior exactly

**Cons**:
- ❌ Requires GitHub API authentication
- ❌ Complex implementation
- ❌ Only works for GitHub-hosted videos

**Implementation** (Conceptual):

```javascript
// Fetch actual video URL from GitHub
async function fetchGitHubVideoUrl(attachmentId) {
    const response = await fetch(`https://api.github.com/repos/.../assets/${attachmentId}`);
    const data = await response.json();
    return data.download_url; // Actual video URL
}

// In videoExtension renderer:
renderer(token) {
    if (token.type === 'githubVideo') {
        // Async fetch (problematic in synchronous renderer)
        // Would need to modify MarkdownService.render() to be async
    }
}
```

**Not Recommended**: Too complex for initial implementation.

---

## 📊 Comparison with Similar Projects

### 1. **GitHub** (Reference Implementation)
- **Approach**: Custom Markdown renderer with video attachment support
- **Video Rendering**: `<video>` tag with controls
- **URL Pattern**: `https://github.com/user-attachments/assets/[UUID]`
- **Lesson**: Video attachments need special API calls

### 2. **GitLab**
- **Approach**: Supports `<video>` in Markdown (HTML whitelisted)
- **Video Rendering**: Users write HTML directly
- **Lesson**: Simple HTML allowlist works

### 3. **StackEdit**
- **Approach**: No video embedding (links only)
- **Lesson**: Common to not support video initially

### 4. **Obsidian**
- **Approach**: Supports HTML `<video>` tags in Markdown
- **Video Rendering**: Passes through HTML to preview
- **Lesson**: If DOMPurify allows `<video>`, it just works

---

## 🧪 Testing Plan

### Test Cases

#### Test 1: Direct Video URL (MP4)
```markdown
Check out this video: https://example.com/demo.mp4
```

**Expected**: Embedded video player appears

#### Test 2: Video with Markdown Link Syntax
```markdown
[Watch Demo](https://example.com/demo.mp4)
```

**Expected**: Should this embed or stay as link? (Design decision needed)

#### Test 3: GitHub Video Attachment
```markdown
Video: https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062
```

**Expected**: Link with "View Video" text (or embedded if we implement API)

#### Test 4: Multiple Video Formats
```markdown
MP4: https://example.com/video.mp4
WebM: https://example.com/video.webm
OGG: https://example.com/video.ogg
```

**Expected**: All render as `<video>` with correct `type` attribute

#### Test 5: Security - Malicious Video URL
```markdown
<script>alert('xss')</script>
```

**Expected**: DOMPurify strips malicious content

---

## 🔧 Integration with Existing Codebase

### Dependencies
- ✅ No new npm packages needed
- ✅ Uses existing `marked` extension pattern
- ✅ DOMPurify already configured to allow `<video>`

### Files to Modify
1. **New File**: `src/core/markdown/extensions/video.js`
2. `src/core/markdown/index.js` (register extension)
3. `public/css/premium-ui.css` (add video styles)

### Files NOT to Modify
- ❌ `src/utils/scroll-sync.js` (unrelated)
- ❌ `index.html` (no UI changes needed)
- ❌ `src/core/markdown/extensions/katex.js` (separate concern)

---

## 📈 Performance Impact

### Bundle Size
- **New extension file**: ~2 KB
- **No new dependencies**: 0 KB
- **Total increase**: ~2 KB (negligible)

### Runtime Performance
- **Video detection**: Regex match on each inline token (<1ms)
- **DOMPurify**: Already sanitizing HTML, no extra cost
- **Video loading**: Browser-native, no JavaScript overhead

---

## 🎯 Recommended Solution

**Choose Solution 1** (Custom Marked Extension) because:
1. Integrates seamlessly with existing Markdown pipeline
2. Handles multiple video URL patterns
3. Follows codebase patterns (like `katexExtension`)
4. Extensible for future video platforms

### Implementation Steps

1. **Create extension file**: `src/core/markdown/extensions/video.js`
2. **Register extension** in `src/core/markdown/index.js`
3. **Add CSS styling** in `public/css/premium-ui.css`
4. **Test** with various video URLs
5. **Document** supported video formats in `README.md`

### GitHub Video Attachments (Future Enhancement)
For full GitHub compatibility, consider:
- Adding a "Fetch Video" button next to GitHub video links
- Using GitHub API to get actual video URL (requires auth)
- Showing video thumbnail as preview

---

## 📚 References

1. [Marked.js Custom Extensions](https://marked.js.org/using_pro/extensions)
2. [HTML5 Video Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
3. [DOMPurify Configuration](https://github.com/cure53/DOMPurify)
4. [GitHub Video Attachments](https://github.blog/2021-05-13-video-uploads-available-github/)
5. [Issue #40 Screenshot](https://github.com/Nir-Bhay/markups/issues/40)

---

## 🔄 Follow-Up Actions

- [ ] Decide: Should Markdown link syntax `[text](video.mp4)` embed video or stay as link?
- [ ] Test DOMPurify with `<video>` tags (verify not stripped)
- [ ] Consider adding video upload feature (drag-and-drop to editor)
- [ ] Add video embedding to feature documentation
- [ ] Create example video in default template

---

**Last Updated**: July 25, 2026  
**Author**: AI Assistant (based on codebase analysis)  
**Next Review**: After implementation and user testing
