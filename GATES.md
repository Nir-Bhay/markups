# Gates: media customize isolation + smooth preview

OWNS: GATES.md, scripts/qa/check-image-ir-update.mjs, scripts/qa/check-media-customize.mjs, src/features/image-resize/**, src/features/video-controls/**, src/features/image-controls/index.js, src/main.js, src/__tests__/image-ir-update.test.js, src/__tests__/video-markdown-sync.test.js, tests/e2e/image-ir-update.spec.js, tests/e2e/video-customize.spec.js

Scope: Resizing or customizing one preview image, GIF, or video must update only that item's markdown state without sibling bleed or full preview reload blink.

- [x] G1: updating markdown image N never writes data-ir onto sibling images
  CHECK: node scripts/qa/check-image-ir-update.mjs
  EXPECT: image-ir update isolation passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; path=f231c59b8bd3/75 entries; EXPECT=matched; output-sha256=eeade2c25312a0395b6a629c7580cf664ddeb81ccbbd49e12b8387c175756845; output-bytes=33

- [x] G2: unit tests prove index increment and single-image replace
  CHECK: npx vitest run src/__tests__/image-ir-update.test.js
  EXPECT: Test Files  1 passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; path=f231c59b8bd3/75 entries; EXPECT=matched; output-sha256=4a74075339a97fdb42e804270177e0edf5287ef12a1387d32f1a751619215eb0; output-bytes=212

- [x] G3: image markdown writeback skips full preview convert path
  CHECK: node scripts/qa/check-image-ir-update.mjs --blink
  EXPECT: image-ir no-blink writeback passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; path=f231c59b8bd3/75 entries; EXPECT=matched; output-sha256=3b4dffd7e4ec053b1ef2365c6d892f604f39ac9cd079f2ad53f1abc8b2982896; output-bytes=35

- [x] G4: live Split preview — resize one of three sibling images; only that image changes size; no full preview blink
  EVIDENCE: 2026-09-19 playwright tests/e2e/image-ir-update.spec.js — attrCount=1 convertBlink=0 markerSurvived=true widths=[440px,'','']

- [x] G5: GIF and video customize never bleed attrs onto sibling media on the same line
  CHECK: node scripts/qa/check-media-customize.mjs
  EXPECT: media customize isolation passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; output=media customize isolation passed

- [x] G6: video customize uses no-blink markdown writeback path
  CHECK: node scripts/qa/check-media-customize.mjs --blink
  EXPECT: media customize no-blink writeback passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; output=media customize no-blink writeback passed

- [x] G7: live Split preview — customize one of three sibling videos; only that video changes; no preview blink
  EVIDENCE: 2026-09-19 playwright tests/e2e/video-customize.spec.js — videoBlocks=1 convertBlink=0 markerSurvived=true

- [x] G8: leftover audit — colliding-URL picture/HTML imgs do not steal markdown irIndex; HTML width writeback survives regex lastIndex
  CHECK: node scripts/qa/check-media-customize.mjs
  EXPECT: media customize isolation passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; output=media customize isolation passed
