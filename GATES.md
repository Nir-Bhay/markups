# Gates: Markups remaining bugs — finish & land

Scope: finish the leftover Markups fixes reported by Nirbhay during live testing on
2026-08-24 (video reload-on-keystroke, preview refresh feel) plus land the already-written
emoji regression fix. Intended for local `review/integration` branch.

- [x] G1: typing no longer recreates/reloads the same preview video every keystroke
  CHECK: node scripts/verify-gate-video-reuse.mjs
  EXPECT: video reuse gate passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; path=c71e3d816cf3/86 entries; output=(node:19484) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated. | (Use `node --trace-deprecation ...` to show where

- [x] G2: full unit suite is green after edits
  CHECK: node scripts/verify-gate-suite.mjs
  EXPECT: suite gate passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; path=c71e3d816cf3/86 entries; output=(node:18584) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated. | (Use `node --trace-deprecation ...` to show where

- [x] G3: production build is clean after edits
  CHECK: node scripts/verify-gate-build.mjs
  EXPECT: build gate passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; path=c71e3d816cf3/86 entries; output=(node:8824) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated. | (Use `node --trace-deprecation ...` to show where 

- [x] G4: emoji regression fix (core/markdown emoji flatten) is committed on review/integration
  CHECK: node scripts/verify-gate-emoji-commit.mjs
  EXPECT: emoji commit gate passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\harmes\projects\markups; path=c71e3d816cf3/86 entries; output=emoji commit gate passed

- [ ] G5: changes landed on review/integration and pushed (manual — Nirbhay reviews build in browser)
  EVIDENCE: pending
