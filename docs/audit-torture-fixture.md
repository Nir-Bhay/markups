# Markdown torture-test fixture — exercises every edge case for the 5 fixes
# Reporter (wexiyeb618) original test URLs + expanded cases

# ============================================================
# FIX #42 — XML preview
# ============================================================

## F42.1 Reporter's exact case (attr-name=purple, tag+entity=blue)
```xml
<Sid Name="test" Timing="4" Flag="1" />
```

## F42.2 Uppercase fence (same as F42.1 — both must highlight)
```XML
<Sid Name="test" Timing="4" Flag="1" />
```

## F42.3 XML namespaces
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="red"/>
  <text x="50" y="55" text-anchor="middle">SVG</text>
</svg>
```

## F42.4 CDATA + entities + DOCTYPE
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE note SYSTEM "Note.dtd">
<note>
  <to>Alice</to>
  <message>5 &lt; 10 &amp; 7 &gt; 3 &quot;hello&quot; &apos;world&apos;</message>
  <![CDATA[ raw <b>not parsed</b> & still literal ]]>
</note>
```

## F42.5 Mixed-case tags + nested
```xml
<HTML>
  <Body>
    <P>Hello <B>world</B>!</P>
  </Body>
</HTML>
```

## F42.6 Self-closing + empty
```xml
<br/>
<hr />
<img src="x" alt=''/>
<a></a>
```

## F42.7 Mixed HTML
```xml
<div class="wrapper" data-id="42">
  <p>Text with <a href="https://example.com?a=1&amp;b=2">link &amp; entity</a></p>
  <!-- inline comment -->
</div>
```

## F42.8 Malformed (graceful fail)
```xml
<unclosed>
<brk>
<<invalid>>
```

# ============================================================
# FIX #44 — INI preview
# ============================================================

## F44.1 Reporter's exact case
```ini
[ID_1_Text_Label]
Text
```

## F44.2 .gitconfig style (key + quoted values + booleans)
```ini
[user]
    name = John Doe
    email = john@example.com
    signingkey = ABC123
[core]
    autocrlf = false
    editor = "vim"
[alias]
    co = checkout
```

## F44.3 Windows-style line continuations (backslashes)
```ini
[Database]
Server=localhost\
Port=5432\
User=admin
```

## F44.4 Comments (both ; and #)
```ini
; comment line
# hash comment
[section]
key=value  ; inline comment
```

## F44.5 Sectionless keys + empty values + quoted
```ini
standalone_key=value
empty_key=
quoted="multi word value"
single='single quotes'
```

## F44.6 Mixed case sections
```ini
[SectionA]
[SectionB]
[SECTION_C]
[ "Quoted Section" ]
```

## F44.7 Real-world wexiyeb618 case (descriptive sections + values)
```ini
[volume]
master = 50
pcm = 50
[alsa]
device = plughw:1,0
```

# ============================================================
# FIX #40 — Video embed
# ============================================================

## F40.1 Direct video link (mp4)
https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4

## F40.2 GitHub user-attachments video URL (the issue's exact test)
https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062

## F40.3 GitHub user-attachments IMAGE URL (must NOT be labeled video — issue's bug)
https://github.com/user-attachments/assets/ae2f8a6f-d337-4277-9c02-e0400b7d7336

## F40.4 Image syntax with the image URL (reporter scenario: picture link in Write → must show picture, not "Open video")
![image](https://github.com/user-attachments/assets/ae2f8a6f-d337-4277-9c02-e0400b7d7336)

## F40.5 Image syntax with VIDEO URL (must play, not show "Open video")
![video](https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062)

## F40.6 Mixed embed
Here is a [regular image](https://github.com/user-attachments/assets/ae2f8a6f-d337-4277-9c02-e0400b7d7336) and a [video link](https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062) side by side.

## F40.7 Network-broken URL (graceful fallback)
https://github.com/user-attachments/assets/this-asset-does-not-exist-12345

## F40.8 Markdown image alt text vs URL (alt="broken", url=video)
![alt text only](https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4)

# ============================================================
# FIX #45 — Emoji shortcodes
# ============================================================

## F45.1 Basic shortcodes
Hello :smile: world :+1: :rocket: :fire: :heart:

## F45.2 Shortcode inside heading
# :rocket: Heading with emoji

## F45.3 Shortcode inside code span (must NOT render as emoji)
This is `:smile:` inside code, and `:+1:` here.

## F45.4 Shortcode inside fenced code block (must NOT render)
```
:smile: should stay literal in code block
```

## F45.5 Shortcode inside link text
[:link: GitHub](https://github.com)

## F45.6 Unknown shortcode (must stay literal, not broken)
Unknown :not_a_real_emoji_xyz: shortcode

## F45.7 Emoji in table cell
| Emoji | Name |
|---|---|
| :smile: | smile |
| :+1: | thumbs up |

## F45.8 Emoji with modifier (skin tone)
:wave::skin-tone-2:

## F45.9 gemoji edge case (shortcodes with hyphens, underscores)
:non-potable_water: :bowing_man: :bald_person:

# ============================================================
# FIX #39 — Sync scroll
# ============================================================

## F39.1 Long document with multiple sections
# Section 1
This is a long block of text that will cause the editor to scroll.

This is a long block of text that will cause the editor to scroll.

This is a long block of text that will cause the editor to scroll.

This is a long block of text that will cause the editor to scroll.

# Section 2
| Col1 | Col2 | Col3 |
|---|---|---|
| a | b | c |
| d | e | f |
| g | h | i |
| j | k | l |
| m | n | o |
| p | q | r |
| s | t | u |
| v | w | x |
| y | z | a1 |
| b1 | c1 | d1 |
| e1 | f1 | g1 |
| h1 | i1 | j1 |

# Section 3
End of document — preview should be fully scrolled.