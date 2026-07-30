# Video Link UX Research & Design Options

> Problem: When a user pastes a video link in Markdown, what should the preview show?
> Current behavior: Auto-embed everything.
> Desired: Respect user intent — sometimes they want an embed, sometimes a link, sometimes both.

---

## 1. User Intent Analysis

When a user pastes a video URL, they may intend:

| Intent | Example Markdown | What they want |
|---|---|---|
| **Embed player** | `https://youtu.be/dQw4w9WgXcQ` | Inline player in preview |
| **Labeled link** | `[My video](https://youtu.be/dQw4w9WgXcQ)` | Clickable text that opens the video |
| **Thumbnail + link** | `![Thumb](thumb.jpg)` | Visual preview with link |
| **Download** | `[Download](video.mp4)` | Save file locally |
| **Showcase** | `https://example.com/demo.mp4` | Play inline if browser supports it |
| **Reference** | `[see issue #40](https://youtu.be/...)` | Just a footnote-style link |

### Key Insight
**The Markdown syntax itself encodes intent:**
- Bare URL on its own line → likely wants embed
- Labeled link `[text](url)` → likely wants clickable link
- Image syntax `![alt](url)` → likely wants thumbnail preview
- Explicit metadata `{video ...}` → explicit layout control

---

## 2. Industry Patterns

### GitHub
- Bare YouTube/Vimeo URLs → auto-embed iframe
- Labeled links → stay as text links
- No download option

### Notion
- Paste URL → shows rich preview (title, thumbnail, play button)
- Click to expand inline player
- Can resize and reposition

### Obsidian
- Bare URLs → clickable links
- Plugins like `obsidian-embed-video` add embed support
- Explicit syntax: `![[video.mp4]]` or `![](video.mp4)`

### Slack/Discord
- Paste URL → auto-expand preview with play button
- Click to play inline
- Resizable

### WordPress
- Gutenberg block: explicit "Video" block
- URL paste → offers embed or link
- Settings for width, alignment, autoplay

### Pattern Summary
| Platform | Bare URL | Labeled Link | Explicit Syntax |
|---|---|---|---|
| GitHub | Auto-embed | Link | N/A |
| Notion | Rich preview | Link | N/A |
| Obsidian | Link | Link | Plugin-based |
| Slack/Discord | Inline preview | Link | N/A |
| WordPress | Prompt/block | Link | Block required |

---

## 3. Proposed Design Options

### Option A: Smart Detection (Recommended)
Respect Markdown semantics:
- **Bare URL** → auto-embed as player
- **Labeled link `[text](url)`** → keep as clickable link
- **Image syntax `![alt](url)`** → embed as player with alt as fallback text
- **Explicit `{video ...}` metadata** → embed with layout control

**Rationale:** This matches user expectations from other platforms and uses Markdown syntax as a signal of intent.

### Option B: Three-State Toggle
Add a toolbar/button toggle:
- **Auto mode** (default) → smart detection like Option A
- **Link mode** → all videos stay as links
- **Preview mode** → all videos become embeds

**Rationale:** Gives explicit control to users who want consistency.

### Option C: Context Menu / Right-Click
- Hover over video link → tooltip with options: "Open in new tab", "Embed inline", "Download"
- Click → default action based on settings

**Rationale:** Most flexible, but adds UI complexity.

### Option D: Settings-Based
- Add a setting in preferences: "Video link behavior"
- Options: "Auto-embed bare URLs", "Always embed", "Always link"
- Persisted in localStorage/IndexedDB

**Rationale:** User controls behavior globally.

---

## 4. Recommended Approach: Hybrid

Combine **Option A** (smart default) + **Option D** (settings override):

### Default Behavior (Smart Detection)
```markdown
# These auto-embed:
https://youtu.be/dQw4w9WgXcQ
https://vimeo.com/123456
https://github.com/user-attachments/assets/abc123

# These stay as links:
[My video](https://youtu.be/dQw4w9WgXcQ)
[see issue #40](https://youtu.be/dQw4w9WgXcQ)

# These embed with custom label:
![Demo clip](https://example.com/demo.mp4)
```

### Settings Override
Add in Settings > Preview:
- ☐ Auto-embed video links
- ☐ Show download button for direct videos
- ☐ Prefer link mode for labeled links

### Download Feature
For direct video URLs (`.mp4`, `.webm`, etc.):
- Add a small download button overlay on the video player
- Use `fetch` + `blob` + `URL.createObjectURL` to trigger download
- Or simpler: `<a download>` attribute on a hidden link

---

## 5. Implementation Plan

### Phase 1: Smart Detection (Low effort)
1. Revert labeled-link embed for non-hosted videos
2. Keep embed for bare URLs + image syntax
3. Add download button for HTML5 video elements
4. Add unit tests

### Phase 2: Settings (Medium effort)
1. Add `videoLinkBehavior` setting
2. Persist in IndexedDB `settings` table
3. Add UI toggle in Settings modal

### Phase 3: Context Menu (Medium effort)
1. Add right-click menu on video links
2. Options: Open, Embed, Download, Copy URL

---

## 6. Code Changes Needed

### File: `src/utils/video-embed.js`
- Revert or refine the labeled-link bypass logic
- Add `isBareUrl()` helper
- Add `shouldEmbed()` function implementing smart detection

### File: `src/features/video-controls/index.js`
- Add download button to video controls toolbar
- Handle direct video URLs vs hosted embeds differently

### File: `src/core/storage/keys.js`
- Add `VIDEO_LINK_BEHAVIOR` setting key

### File: `src/main.js`
- Load/save video link behavior setting
- Pass to video controls

---

## 7. Open Questions

1. **Should labeled YouTube/Vimeo links embed or stay as links?**
   - Current fix: embed always
   - Recommended: respect label → stay as link
   - User preference?

2. **Should download be available for YouTube/Vimeo?**
   - Technically not possible without backend
   - Only for direct URLs

3. **Should there be a visual distinction?**
   - Maybe a small "external link" icon for links vs play button for embeds?

4. **What about accessibility?**
   - Embeds need `title` and `loading="lazy"`
   - Links need clear focus indicators

---

## 8. Recommendation

**Immediate action:**
- Keep the current labeled-link embed behavior as a quick fix
- But add a setting to let users choose "Smart mode" vs "Always embed"

**Better long-term:**
- Implement smart detection (Option A) as the default
- Add download button for direct videos
- Add settings toggle for power users

This respects the diversity of user intentions while keeping the UI simple for most users.
