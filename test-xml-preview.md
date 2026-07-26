## Issue #42 — Enhanced XML Preview Test

Paste this and hard-refresh (`Ctrl+Shift+R`).

### Look for
- Light gray code box (GitHub-like)
- Header with language badge (`xml`) + **Copy** button
- Tags blue, attributes brown/orange, strings dark blue
- Uppercase `XML` fence works the same

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Skill sync definitions -->
<root>
  <Sid Name="test" Timing="4" Flag="1" />
  <Sid Name="SID_If_PlayerTeam_SyncToSkills"
       SyncConditions="軍 == 1軍"
       SyncSids="SID_If_Unit_Dealt_MoreRoundsOfCombat_Than_Foe"
       Flag="1"
       InheritanceCost="1" />
</root>
```

```XML
<Sid Name="SID_Give_FoeDouble_UnitSingle"
     Timing="18"
     Condition="スキル所持(&quot;Enable_Give_FoeDouble_UnitSingle&quot;)"
     Flag="1" />
```

```svg
<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="40" stroke="#116329" fill="#dafbe1" stroke-width="3" />
  <text x="60" y="65" text-anchor="middle" font-size="12">SVG</text>
</svg>
```

```html
<div class="card">
  <h2>HTML still works</h2>
  <p class="muted">Same GitHub-style chrome</p>
</div>
```
