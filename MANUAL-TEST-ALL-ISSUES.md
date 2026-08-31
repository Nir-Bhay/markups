# 🧪 Markups — Saare 5 Issues ka Manual Test File

> Ye file editor mein paste karo aur neeche diye check karne chalein.
> Har section pe label diya hai ki kaunsa issue test ho raha hai.

---

## ISSUE #45 — EMOJI SHORTCODES

Neeche wale type karo, sab GitHub-exact emoji dikhne chahiye:

:smile:  :+1:  :fire:  :rocket:  :heart:  :smile:

Aur unknown shortcode literal hi rehna chahiye (galat emoji NAHI):

:xyz_not_exist: and :hover123: and `:something:`

---

## ISSUE #42 — XML SYNTAX HIGHLIGHT

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Query Name="test" Timing="4" Flag="1">
  <Condition operation="gt" value="10" />
  <Note>This is a &amp; test &lt;xml&gt;</Note>
</Query>
```

> Tag (`<Query>`), attribute name (`Name`), attribute value ("test") — sab **color-coded** dikhna chahiye (blue/green/red), plain black NAHI.

Same file `XML` capital mein bhi test karo:

```XML
<Query Name="capital" />
```

---

## ISSUE #44 — INI SYNTAX HIGHLIGHT

```ini
[Server]
host = 127.0.0.1
port = 8080
enable_gzip = true

[Database]
type = mysql
name = markups
```

> `[Server]` section, key (`host`), value (`127.0.0.1`) — **color-coded** dikhna chahiye.

---

## ISSUE #40 — VIDEO EMBED

Explicit embed tag (yeh video chalaana chahiye):

{video mode=embed}(https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4)

GitHub picture-link (yeh IMAGE dikhni chahiye, dead "Open video" NAHI — image ka URL ho to):

![image](https://github.com/user-attachments/assets/00000000-0000-0000-0000-000000000000)

---

## ISSUE #39 — SYNC SCROLL (tall page)

Yahan neeche ek **badi table** hai. Editor scroll karte waqt preview bhi saath mein scroll karna chahiye, aur sabse **neeche tak successfully jaana chahiye** (yeh clear hi text milna chahiye):

| Flag | Name | Description | Status | Value | Owner | Priority | Notes |
|------|------|-------------|--------|-------|-------|----------|-------|
| 🇮🇳 1 | Alpha | First row details go here | Open | 10 | Abhay | High | Some note here |
| 🇮🇳 2 | Bravo | Second row details go here | Open | 20 | Abhay | High | Some note here |
| 🇮🇳 3 | Charlie | Third row details go here | Open | 30 | Abhay | Mid | Some note here |
| 🇮🇳 4 | Delta | Fourth row details go here | Closed | 40 | Abhay | Low | Some note here |
| 🇮🇳 5 | Echo | Fifth row details go here | Open | 50 | Abhay | High | Some note here |
| 🇮🇳 6 | Foxtrot | Sixth row details go here | Open | 60 | Abhay | Mid | Some note here |
| 🇮🇳 7 | Golf | Seventh row details go here | Closed | 70 | Abhay | Low | Some note here |
| 🇮🇳 8 | Hotel | Eighth row details go here | Open | 80 | Abhay | High | Some note here |
| 🇮🇳 9 | India | Ninth row details go here | Open | 90 | Abhay | Mid | Some note here |
| 🇮🇳 10 | Juliet | Tenth row details go here | Open | 100 | Abhay | High | Some note here |
| 🇮🇳 11 | Kilo | Eleventh row details go here | Closed | 110 | Abhay | Low | Some note here |
| 🇮🇳 12 | Lima | Twelfth row details go here | Open | 120 | Abhay | Mid | Some note here |
| 🇮🇳 13 | Mike | Thirteenth row details go here | Open | 130 | Abhay | High | Some note here |
| 🇮🇳 14 | November | Fourteenth row details go here | Closed | 140 | Abhay | Low | Some note here |
| 🇮🇳 15 | Oscar | Fifteenth row details go here | Open | 150 | Abhay | Mid | Some note here |
| 🇮🇳 16 | Papa | Sixteenth row details go here | Open | 160 | Abhay | High | Some note here |
| 🇮🇳 17 | Quebec | Seventeenth row details go here | Open | 170 | Abhay | Mid | Some note here |
| 🇮🇳 18 | Romeo | Eighteenth row details go here | Closed | 180 | Abhay | Low | Some note here |

---

> ### ✅ YE CLEAR TEXT NEECHE MILNA CHAHIYE (issue #39 ka proof)
> Agar is text tak preview scroll ho raha hai = sync scroll fix kaam kiya. Agar stalling ho (ruk jaye 86% pe) = fix nai chala.
