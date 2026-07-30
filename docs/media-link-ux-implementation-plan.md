# Media Link UX — Implementation Plan

> Based on deep research across GitHub, Notion, Obsidian, Slack, Discord, Typora, VS Code, WordPress, and Medium.
> Confidence: High for core patterns; Medium-High for edge cases.

---

## 1. Research Synthesis

### Video Behavior Across Platforms

| Platform | Bare URL | Labeled Link | Image Syntax | Notes | Confidence |
|---|---|---|---|---|---|
| GitHub README | ❌ no embed | ✅ link | ❌ no video embed | Strips iframe; thumbnail-link workaround only | High |
| GitHub Pages | ✅ iframe | ✅ link | ✅ iframe | Full HTML allowed on Pages | High |
| Notion | ✅ preview card | ✅ link | ✅ embed card | Iframely-backed rich preview | High |
| Obsidian | ✅ link/plugin | ✅ link | ✅ via plugin | Conservative default; plugins add embed | Medium |
| Slack | ✅ preview card | ✅ link | ✅ block | Unfurl preview, not inline playback | Medium-High |
| Discord | ✅ preview card | ✅ link | ✅ embed | Similar to Slack unfurl behavior | Medium-High |
| Typora | ✅ limited iframe | ✅ link | ✅ iframe | HTML-enabled editor | High |
| VS Code | ❌ preview | ✅ link | ✅ via extension | Conservative default | Medium |

### Image Behavior Across Platforms

| Platform | Direct Image URL | `![alt](url)` | Link `[text](url)` | Controls | Confidence |
|---|---|---|---|---|---|
| GitHub | ✅ embed | ✅ embed | ✅ link | Limited resize via HTML | High |
| Notion | ✅ embed | ✅ embed | ✅ link | Resize, align, caption | Medium-High |
| Obsidian | ✅ embed | ✅ embed | ✅ link | Width/height via wikilinks | Medium |
| Slack | ✅ preview | ✅ embed | ✅ link | Basic resize UI | Medium |
| WordPress | ✅ embed | ✅ embed | ✅ link | Resize, align, caption, lightbox | High |
| Medium | ✅ embed/CDN | ✅ embed | ✅ link | Resize, align, caption | Medium |

---

## 2. Core Principles

### A. Respect Markdown Syntax as Intent Signal
- **Bare URL on its own line** → user likely wants embed/preview
- **Labeled link `[text](url)`** → user likely wants clickable link
- **Image syntax `![alt](url)`** → user wants inline preview
- **Explicit metadata `{video ...}` / HTML** → user wants control

### B. Safe Defaults with Escape Hatches
- Default to embed for known media types
- Always preserve original link behavior as fallback
- Provide user controls to override behavior

### C. Accessibility First
- ARIA roles/labels for all interactive media
- Keyboard navigation for toolbars/controls
- Alt text/captions where applicable
- Focus management

### D. Performance & Privacy
- Lazy load offscreen media
- Use privacy-enhanced embeds (`youtube-nocookie.com`)
- Respect `prefers-reduced-motion`
- Soft cap on simultaneous players

---

## 3. Recommended Solution: Hybrid Smart Detection + User Controls

### Default Behavior

#### Videos
```markdown
# Auto-embed as player:
https://youtu.be/dQw4w9WgXcQ
https://vimeo.com/123456
https://github.com/user-attachments/assets/abc123

# Keep as clickable link:
[Watch demo](https://youtu.be/dQw4w9WgXcQ)
[see issue #40](https://youtu.be/dQw4w9WgXcQ)

# Embed with layout metadata:
https://example.com/demo.mp4 {video width=50% align=right}
```

#### Images
```markdown
# Auto-embed:
![Alt text](https://example.com/image.png)

# Clickable image link:
[![Alt text](https://example.com/image.png)](https://example.com/other-page)

# Resizable embedded image:
![Alt text](https://example.com/image.png) {width=50% align=center}
```

### User Controls

#### Per-Media Toolbar
Click any embedded video/image to show a floating toolbar with:
- **Size presets** (25%, 50%, 75%, 100%)
- **Alignment** (left, center, right)
- **Mode toggle**: Embed ↔ Link
- **Download** (direct files only)
- **Open in new tab**

#### Global Settings
In Settings > Preview:
- ☐ Auto-embed video links
- ☐ Auto-embed image links
- ☐ Show download button for direct media
- ☐ Default video width: 100%
- ☐ Default alignment: center

---

## 4. Implementation Plan

### Phase 1: Smart Detection Core (1-2 days)
1. Refactor `src/utils/video-embed.js`:
   - Add `shouldEmbedVideo(element, markdownContext)` function
   - Respect labeled links for non-hosted videos
   - Keep embed for bare URLs + image syntax
2. Add `src/utils/image-embed.js`:
   - Detect image URLs
   - Handle `![alt](url)` vs `[![alt](img)](url)`
   - Add lazy loading + aspect ratio
3. Add unit tests for both modules

### Phase 2: Per-Media Controls (2-3 days)
1. Extend `src/features/video-controls/index.js`:
   - Add mode toggle button (embed/link)
   - Add download button for direct URLs
   - Add "Open in new tab" button
2. Create `src/features/image-controls/index.js`:
   - Similar toolbar for images
   - Resize handles or width presets
   - Alignment controls
   - Download button
   - Lightbox toggle

### Phase 3: Settings & Persistence (1 day)
1. Add settings keys to `src/core/storage/keys.js`
2. Add UI in Settings modal
3. Persist to IndexedDB `settings` table
4. Load on app startup

### Phase 4: Accessibility & Polish (1 day)
1. ARIA labels for all toolbars
2. Keyboard navigation
3. Screen reader testing
4. Focus management
5. Reduced motion support

### Phase 5: Migration & Backward Compatibility (1 day)
1. Handle existing `{video ...}` metadata
2. Migrate old video controls state
3. Ensure old markdown still renders correctly

---

## 5. Code Architecture

### New Files
```
src/utils/image-embed.js          # Image embed logic
src/features/image-controls/index.js  # Image toolbar
src/__tests__/imageEmbed.test.js   # Image tests
src/__tests__/imageControls.test.js # Image control tests
```

### Modified Files
```
src/utils/video-embed.js          # Smart detection
src/features/video-controls/index.js  # Enhanced toolbar
src/core/storage/keys.js          # New settings keys
src/main.js                       # Load/save settings
index.html                        # Settings UI
```

### Settings Schema
```javascript
{
  videoLinkBehavior: 'smart' | 'always-embed' | 'always-link',
  imageLinkBehavior: 'smart' | 'always-embed' | 'always-link',
  showDownloadButton: true,
  defaultVideoWidth: '100%',
  defaultVideoAlign: 'center',
  defaultImageWidth: '100%',
  defaultImageAlign: 'center',
  enableLightbox: true
}
```

---

## 6. Edge Cases & Handling

| Edge Case | Video | Image |
|---|---|---|
| Broken URL | Fallback to link with error icon | Show broken image icon + alt text |
| Private/unauthenticated | Show link, don't embed | Show link, don't embed |
| Huge file | Lazy load, soft cap | Lazy load, max-width constraint |
| SVG with scripts | Sanitize strictly | Sanitize strictly |
| Animated media | Respect reduced motion | Respect reduced motion |
| Multiple embeds | Limit simultaneous players | Lazy load offscreen |
| Mobile | Responsive wrapper, no autoplay | Responsive wrapper |
| CSP restrictions | Fallback to link | Fallback to link |

---

## 7. Accessibility Checklist

- [ ] All embeds have `title` attribute
- [ ] Toolbars have `role="toolbar"` + `aria-label`
- [ ] Keyboard navigation: Arrow keys, Home, End, Escape
- [ ] Focus management: trap focus in toolbar when open
- [ ] Alt text required for all images
- [ ] Captions track for videos when available
- [ ] `loading="lazy"` for offscreen media
- [ ] `prefers-reduced-motion` respected
- [ ] Screen reader tested with NVDA/VoiceOver

---

## 8. Testing Plan

### Unit Tests
- [ ] Video smart detection: bare vs labeled vs image syntax
- [ ] Image smart detection: embed vs link vs image-as-link
- [ ] Toolbar controls: size, align, mode toggle, download
- [ ] Settings persistence
- [ ] Fallback behaviors

### Integration Tests
- [ ] Mixed markdown with videos and images
- [ ] Mode switching: edit ↔ preview
- [ ] Settings change affects existing embeds
- [ ] Mobile responsive behavior

### Manual Tests
- [ ] Screen reader: NVDA, VoiceOver, JAWS
- [ ] Keyboard-only navigation
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge

---

## 9. Open Decisions

1. **Should labeled YouTube/Vimeo links embed or stay as links?**
   - Recommendation: stay as links by default, embed on explicit toggle
   - Confidence: Medium-High

2. **Should download be available for YouTube/Vimeo?**
   - Recommendation: no, only for direct URLs
   - Confidence: High

3. **Should there be a visual distinction between embed and link?**
   - Recommendation: yes, subtle icon/border difference
   - Confidence: Medium

4. **Should lightbox be default or opt-in?**
   - Recommendation: opt-in via setting
   - Confidence: Medium

5. **Should we support caption tracks for videos?**
   - Recommendation: allow via `{video caption="..."}` metadata
   - Confidence: Medium

---

## 10. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Test coverage | >80% | Vitest coverage report |
| Accessibility | WCAG 2.1 AA | axe-core + manual screen reader test |
| Performance | <100ms embed overhead | Lighthouse |
| User confusion | <5% support tickets | Track feedback |
| Cross-browser | 4/4 browsers | Manual test matrix |

---

## 11. Final Recommendation

**Implement Hybrid Smart Detection + User Controls**

This approach:
- Respects user intent through Markdown syntax
- Provides escape hatches via toolbar and settings
- Follows industry patterns from GitHub, Notion, Obsidian
- Maintains backward compatibility
- Is accessible and performant

**Confidence: High**

The implementation should be done in phases, starting with smart detection core, then controls, then settings, then accessibility polish.
