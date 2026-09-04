# 📋 Markups Issues — Complete Testing Checklist
# URL: https://markups.dev | Branch: main | Commit: 34aa588
# Instructions: Open https://markups.dev → click "Clear all" → paste each test case below into editor → verify expected result → mark ✅/❌.

# ═══════════════════════════════════════════════════════════════
# ISSUE #42 — XML PREVIEW HIGHLIGHT
# Reporter (wexiyeb618): "tag name + entity refs should be blue, attributes purple, NOT plain black"
# ═══════════════════════════════════════════════════════════════

# === #42-A: REPORTER'S EXACT FAILING CASES ===

# A1) Reporter's literal test case (verbatim from issue):
```xml
<Sid Name="test" Timing="4" Flag="1" />
```
# Expected: <Sid=blue, Name=purple, "test"=attrValue, Timing=purple, Flag=purple, /=punctuation. NOT all-black.

# A2) Reporter's second complaint — uppercase fence:
```XML
<Sid Name="test" Timing="4" Flag="1" />
```
# Expected: Same colors as A1 (case-insensitive language tag).

# === #42-B: TOKEN COVERAGE — every token class that should be styled ===

# B1) All major XML token classes in one block:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE note SYSTEM "Note.dtd">
<note version="1.0">
  <!-- comment with <not parsed> inside -->
  <![CDATA[ raw <b>not parsed</b> & literal ]]>
  <to>Alice</to>
  <message attr1="value1" attr2='value2'>5 &lt; 10 &amp; 7 &gt; 3 &quot;quoted&quot; &apos;apos&apos;</message>
  <empty/>
  <self-close attr="x"/>
  <nested>
    <child>data</child>
  </nested>
</note>
```
# Expected: prolog blue, DOCTYPE blue, comment gray, CDATA block colored, tag=blue, attr-name=purple, attr-value=lighter, entity=blue, text=default.

# B2) XML namespace (svg):
```xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="40" fill="url(#grad1)" />
  <text x="50" y="55" text-anchor="middle" fill="white">SVG</text>
</svg>
```
# Expected: xmlns attribute highlighted, namespace URL visible, all attr-names purple.

# B3) Mixed-case tags:
```xml
<HTML>
  <Body>
    <P>Hello <B>world</B>!</P>
  </Body>
</HTML>
```
# Expected: even ALLCAPS tags (HTML, BODY, P, B) tokenized same as lowercase.

# === #42-C: ATTRIBUTE QUOTING & ENTITY EDGE CASES ===

# C1) Single vs double quotes:
```xml
<a href='single quoted' data-double="value with 'apostrophe' inside" mixed='has "double" inside'/>
```
# Expected: both quote styles produce attr-value tokens; embedded quotes inside other-style quotes are NOT syntax errors.

# C2) Entity inside attribute value:
```xml
<img src="?a=1&amp;b=2&amp;c=3" alt="5 &lt; 10"/>
```
# Expected: `&amp;`, `&lt;` highlighted as entities (blue) inside attr-value.

# C3) Empty attribute and no-quote attribute (invalid but must not crash):
```xml
<a disabled class= data-empty=""/>
```
# Expected: no JS errors, tokens still produced for the well-formed parts.

# C4) Attribute with special chars:
```xml
<a class="my-class_name.v2" data-x="{json}" title='has "double" and \'single\' quotes'/>
```
# Expected: all tokenized, no parser failure.

# === #42-D: MALFORMED INPUT — graceful behavior ===

# D1) Empty tag (invalid):
```xml
<>
```
# Expected: shown as plain text or partial token, no JS error in console.

# D2) Unclosed tag:
```xml
<unclosed>
<brk>
```
# Expected: rendered as plain text or partial, no crash.

# D3) Mismatched tags:
```xml
<a><b></a></b>
```
# Expected: rendered without crash (Prism is permissive).

# D4) Mixed XML and HTML:
```xml
<div>
  <p>Hello</p>
  <svg><circle r="5"/></svg>
</div>
```
# Expected: both `<div>/<p>` and `<svg>/<circle>` tokenized.

# D5) Very long single line (1000+ chars):
```xml
<a b="c" d="e" f="g" h="i" j="k" l="m" n="o" p="q" r="s" t="u" v="w" x="y" z="aa" aa="bb" cc="dd" ee="ff" gg="hh" ii="jj" kk="ll" mm="nn" oo="pp" qq="rr" ss="tt" uu="vv" ww="xx" yy="zz" aaa="bbb" ccc="ddd" eee="fff" ggg="hhh" iii="jjj" kkk="lll" mmm="nnn" ooo="ppp" qqq="rrr" sss="ttt" uuu="vvv" www="xxx" yyy="zzz"/>
```
# Expected: no perf hang, all attrs tokenized (markup mode handles long lines).

# ═══════════════════════════════════════════════════════════════
# ISSUE #44 — INI PREVIEW HIGHLIGHT
# Reporter (wexiyeb618): "ini text preview doesn't match Github's"
# ═══════════════════════════════════════════════════════════════

# === #44-A: REPORTER'S EXACT FAILING CASE ===

# A1) Reporter's verbatim:
```ini
[ID_1_Text_Label]
Text
```
# Expected: [ID_1_Text_Label] = colored section header, Text = key/value colored. Before fix: all-black.

# === #44-B: REAL-WORLD INI STYLES ===

# B1) Windows-style INI with semicolon comments:
```ini
; Application settings
# Hash-style comment also common
[Database]
Server=localhost\SQLEXPRESS
Port=1433
User=admin
Password=secret123

[Network]
Bind=0.0.0.0
Port=8080
Timeout=30  ; seconds
```

# Expected: comments gray, sections colored, keys colored, values colored. Backslash continuations OK.

# B2) .gitconfig style (real-world):
```ini
[user]
    name = John Doe
    email = john@example.com
    signingkey = ABC123
[core]
    autocrlf = false
    editor = "vim"
    excludesfile = ~/.gitignore_global
[alias]
    co = checkout
    br = branch
    st = status
    unstage = reset HEAD --
[color]
    ui = auto
[push]
    default = simple
```
# Expected: indented keys still colored, quoted values preserved, true/false/string all highlighted.

# B3) PHP-style .ini / php.ini:
```ini
[PHP]
engine = On
short_open_tag = Off
precision = 14
output_buffering = 4096
max_execution_time = 30
memory_limit = 128M
error_reporting = E_ALL & ~E_NOTICE
date.timezone = "UTC"
session.save_handler = files
session.save_path = "/tmp"
upload_max_filesize = 2M
post_max_size = 8M
```
# Expected: every key=value pair colored, even with mixed types (On/Off, numbers, paths, expressions).

# B4) Docker daemon config style:
```ini
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
MountFlags=shared
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
```
# Expected: long values with paths/special chars preserved, all tokens colored.

# === #44-C: EDGE CASES ===

# C1) Sectionless keys (root-level):
```ini
standalone=value
root_key=42
[section1]
k=v
```
# Expected: sectionless keys still colored as key/value.

# C2) Empty values:
```ini
[paths]
empty=
also_empty =
spaces_only =    ""
```
# Expected: all keys colored, empty values still tokenized.

# C3) Quoted values (single + double):
```ini
[user]
name="John Doe"
nickname='JD'
bio="line1
line2"
path="C:\Users\John"
url="https://example.com?a=1&b=2"
```
# Expected: quoted strings preserved as attr-value tokens; embedded chars NOT broken.

# C4) Dotted keys:
```ini
[hosts]
host.example.com = up
api.v2.local = down
[database.production]
url = postgres://localhost
```
# Expected: dotted keys colored normally; dotted section names tokenized.

# C5) Mixed-case section headers:
```ini
[SectionA]
[Section_b]
[SECTION_C]
[Sect123]
```
# Expected: all section headers colored same way regardless of case.

# C6) Inline comment (semicolon after value):
```ini
[server]
port=8080  ; default HTTP port
host=0.0.0.0  # bind all interfaces
```
# Expected: value tokens stop at the `;` or `#`, inline comment colored as comment.

# C7) Unicode in INI:
```ini
[locale]
greeting = "नमस्ते"
currency = "€"
emoji_key = 🔑
```
# Expected: Unicode preserved in values, no encoding errors.

# C8) Malformed INI:
```ini
[unclosed section
key without value
= just a value
[]
[[empty]]
```
# Expected: no crash, malformed parts shown as plain text or partially tokenized.

# ═══════════════════════════════════════════════════════════════
# ISSUE #40 — VIDEO EMBED IN PREVIEW
# Reporter (wexiyeb618): "Allow for video to be seen in preview instead of clicking link?"
# Follow-up bugs: "picture links show 'Open video' label; video square pops in and out while editing"
# ═══════════════════════════════════════════════════════════════

# === #40-A: VIDEO URL — direct video file extensions ===

# A1) Bare mp4 URL on its own line:
https://download.samplelib.com/mp4/sample-5s.mp4

# Expected: inline <video> player with controls. NOT a clickable link.

# A2) mp4 URL inside markdown link:
[click here for video](https://download.samplelib.com/mp4/sample-5s.mp4)

# Expected: replaced with inline <video> player (link text replaced by embed).

# A3) Image-syntax with mp4 URL (image syntax pointing at video file):
![video](https://download.samplelib.com/mp4/sample-5s.mp4)

# Expected: rendered as inline <video> player.

# A4) WebM:
https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/360/Big_Buck_Bunny_360_10s_1MB.webm

# Expected: inline <video> player.

# A5) MOV:
https://download.samplelib.com/mp4/sample-5s.mp4

# (Note: most CDN test files don't host .mov; substitute your own if needed.)

# === #40-B: GITHUB USER-ATTACHMENT URLS ===

# B1) GitHub attachment image URL via markdown image syntax:
![image](https://github.com/user-attachments/assets/ae2f8a6f-d337-4277-9c02-e0400b7d7336)

# Expected: rendered as <img> (NOT mislabeled "Open video"). THIS IS THE CORE BUG FIX.

# B2) GitHub attachment image URL as bare link:
[https://github.com/user-attachments/assets/ae2f8a6f-d337-4277-9c02-e0400b7d7336](https://github.com/user-attachments/assets/ae2f8a6f-d337-4277-9c02-e0400b7d7336)

# Expected: rendered as <img> inline (link replacement shows the image directly).

# B3) GitHub attachment video URL (wexiyeb618's test video):
![video](https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062)

# Expected: rendered as <video> player (since it IS a video on GitHub's CDN).

# B4) GitHub attachment bare link:
https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062

# Expected: rendered as inline <video> player.

# === #40-C: REGRESSION — flicker / reload while editing ===

# C1) Render video, then edit UNRELATED text elsewhere:
1. Paste this entire block:
2. Watch the video load (preview it plays)
3. Add a character at the very top: "EDITED "
4. Add another character
5. Delete that character

# Expected: video player stays in place, no reload/flicker/re-create. Network tab shows NO new fetch for the video.

# C2) Add new text BEFORE the video, watch video stays loaded:
1. Render video (paste B4 above)
2. Click at the very top of editor (above the video URL)
3. Type 50 characters of text
4. Press Enter

# Expected: video stays visible in preview, no re-render of the player.

# === #40-D: HOSTED VIDEO (YouTube / Vimeo) ===

# D1) YouTube watch URL:
https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Expected: rendered as embedded iframe (youtube-nocookie.com domain), with play controls.

# D2) YouTube short URL:
https://youtu.be/dQw4w9WgXcQ

# Expected: same embed.

# D3) Vimeo:
https://vimeo.com/76979871

# Expected: embedded iframe.

# === #40-E: EDGE CASES — should not break ===

# E1) Missing video URL (404 — graceful fallback):
https://github.com/user-attachments/assets/this-asset-does-not-exist-12345

# Expected: not infinite spinner; shows link or placeholder. NO crash.

# E2) Image syntax with image URL + video with NO ext (must disambiguate):
![picture](https://github.com/user-attachments/assets/ae2f8a6f-d337-4277-9c02-e0400b7d7336)
![video](https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062)

# Expected: first = image, second = video player. Both work side by side.

# E3) Video with caption/date attributes:
https://example.com/demo.mp4 {video width=50% align=center caption="My demo video" date="2026-09-01"}

# Expected: video renders with width=50%, centered, caption shown below, date shown.

# E4) Multiple videos in same doc:
https://example.com/v1.mp4

Some text in between.

https://example.com/v2.mp4

# Expected: TWO independent video players, both load independently.

# ═══════════════════════════════════════════════════════════════
# ISSUE #45 — EMOJI SHORTCODES
# Reporter: "Allow emoji syntax to give Github markdown preview"
# (Already closed on repo — retest here)
# ═══════════════════════════════════════════════════════════════

# === #45-A: BASIC SHORTCODES ===

# A1) Most common:
Hello :smile: :rocket: :+1: :fire: :heart: world

# Expected: Hello 😄 🚀 👍 🔥 ❤️ world (Unicode emoji glyphs).

# A2) GitHub-style in PR comments:
@octocat :+1: This PR looks great - it's ready to merge! :shipit:

# Expected: shows 👍 and :shipit: emoji.

# A3) Skin-tone modifier:
:wave::skin-tone-2: :wave::skin-tone-4:

# Expected: different skin tones for wave emoji.

# === #45-B: SHORTCODE BEHAVIOR (must NOT break) ===

# B1) Inline code (must stay literal):
This is `:smile:` in inline code, and `:+1:` here.

# Expected: `:smile:` and `:+1:` stay as literal text inside `<code>`. Code samples must not render emoji.

# B2) Fenced code block (must stay literal):
```
:smile: should stay literal here
:+1: also literal
:rocket: ditto
```

# Expected: shortcodes in code block remain as text (not converted).

# B3) Heading with emoji:
# :rocket: Launch announcement

# Expected: heading shows 🚀. Slug works (TOC link should jump correctly).

# B4) Link text:
[:fire: hot docs](https://example.com)

# Expected: link shows 🔥, clickable.

# B5) Table cell:
| Name | Emoji |
|------|-------|
| Smile | :smile: |
| Rocket | :rocket: |
| Plus | :+1: |

# Expected: emoji glyphs inside table cells.

# B6) Bold/italic with shortcode:
**:fire: Bold fire** and *:rocket: italic rocket*

# Expected: emoji rendered inside formatted text.

# B7) Unknown shortcode stays literal:
Hello :not_a_real_emoji_xyz: world

# Expected: `:not_a_real_emoji_xyz:` stays as plain text. NOT stripped, NOT converted.

# B8) Time literal stays literal:
Meet at 12:30 in the afternoon.

# Expected: `12:30` stays as text (NOT converted to clock emoji).

# B9) CSS pseudo-class stays literal:
Use a:hover rule for styling.

# Expected: `:hover` stays as text (NOT converted).

# B10) Hyphenated/underscored shortcodes:
:non-potable_water: :bowing_man: :bald_person: :family_man_boy_boy:

# Expected: all render as their respective Unicode emojis.

# B11) Shortcode at very start of line:
:rocket: Launches today

# Expected: emoji rendered at line start.

# B12) Shortcode followed by punctuation:
Hello :smile:, world :rocket:!

# Expected: emoji + adjacent punctuation, no broken parsing.

# === #45-C: REGRESSION — heading IDs ===

# C1) Heading with emoji — slug behavior:
# :rocket: Hello world

# Expected: heading has ID, TOC link works (no broken anchor).

# === #45-D: SECURITY ===

# D1) Malicious shortcode-like text:
`:<script>alert(1)</script>:smile:`

# Expected: `<script>` stripped by sanitizer (DOMPurify), shortcode renders as emoji safely.

# D2) Long string of colons:
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

# Expected: no infinite loop, no crash, treated as text.

# ═══════════════════════════════════════════════════════════════
# ISSUE #39 — SYNC SCROLL (Already closed, retest)
# Reporter: "When reaching Flag table, sync scroll stalls, jumps; credit section never shows"
# ═══════════════════════════════════════════════════════════════

# === #39-A: TALL TABLE STRESS ===

# A1) Long doc with 20+ row table:
# Section 1
Introduction paragraph.

| Col1 | Col2 | Col3 | Col4 | Col5 |
|------|------|------|------|------|
| 1    | 2    | 3    | 4    | 5    |
| 6    | 7    | 8    | 9    | 10   |
| 11   | 12   | 13   | 14   | 15   |
| 16   | 17   | 18   | 19   | 20   |
| 21   | 22   | 23   | 24   | 25   |
| 26   | 27   | 28   | 29   | 30   |
| 31   | 32   | 33   | 34   | 35   |
| 36   | 37   | 38   | 39   | 40   |
| 41   | 42   | 43   | 44   | 45   |
| 46   | 47   | 48   | 49   | 50   |
| 51   | 52   | 53   | 54   | 55   |
| 56   | 57   | 58   | 59   | 60   |
| 61   | 62   | 63   | 64   | 65   |
| 66   | 67   | 68   | 69   | 70   |

# Section 2 — Credit / Footer
This is the credit section that MUST be visible at preview bottom when editor reaches bottom.

# Test:
# 1. Scroll editor to the very bottom using End key or Page Down x many times
# 2. Watch preview — the credit section should be FULLY visible at bottom of preview
# 3. Before fix: preview would stall at ~86% with gray bar
# 4. After fix: preview reaches 100% and credit is visible

# === #39-B: REVERSE MAPPING ===

# B1) Scroll preview first, then check editor follows:
1. Render A1's content
2. Click in the preview pane
3. Scroll preview to bottom
4. Check editor also scrolled to bottom

# Expected: reverse sync works (preview → editor).

# === #39-C: EDGE CASES ===

# C1) Toggle sync OFF, then ON:
1. Open settings, disable "Sync scroll"
2. Scroll editor — preview should NOT move
3. Re-enable sync — preview should snap to current editor position

# Expected: toggle works, no ghost scroll while OFF.

# C2) Image/video in mid-doc while scrolling:
1. Render doc with image at line 20 of 100
2. Scroll editor past the image
3. Preview should track editor smoothly even after image loads

# Expected: no jump when image loads.

# C3) Very short doc (5 lines):
# A
# B
# C
# D
# E

# Expected: scroll works both directions, no over-scroll.

# ═══════════════════════════════════════════════════════════════
# BONUS — cross-feature combos (smoke tests for whole pipeline)
# ═══════════════════════════════════════════════════════════════

# X1) XML inside emoji-heavy doc:
# :rocket: XML below

```xml
<a name="x"/>
```

:fire: More emoji

# Expected: heading has emoji, code has colored tokens, paragraph emoji renders.

# X2) Video + emoji + XML all in one doc:
# :movie_camera: Watch this: https://download.samplelib.com/mp4/sample-5s.mp4

And the config:

```ini
[settings]
volume = 80
theme = dark
```

:sparkles: Done!

# Expected: all features render together, no conflicts.

# X3) INI + emoji:
```ini
[user :smile:]
name = John :heart:
```

# Expected: sections + keys colored, emojis render in section/key text.

# ═══════════════════════════════════════════════════════════════
# HOW TO REPORT
# ═══════════════════════════════════════════════════════════════
# 1. For each test, paste into markups.dev
# 2. Check expected result
# 3. Mark ✅ PASS or ❌ FAIL
# 4. For ❌ FAIL: tell me test ID + what you saw vs expected
# 5. Take screenshots of representative PASS cases for the reply

# Format for reporting back:
#   #42-A1: ✅ tag=Sid blue, Name=purple, all colored
#   #44-B1: ✅ sections colored, comments gray
#   #40-B1: ✅ image rendered, NO "Open video" label
#   ...