# Gates: toolbar UX research document

OWNS: docs/toolbar-ux-research/**, scripts/verify-toolbar-ux-research.mjs

Scope: produce a review-only toolbar research document from the current Markups toolbar source plus web research, with no toolbar implementation changes

- [x] G1: the research document contains the required review sections
  CHECK: node scripts/verify-toolbar-ux-research.mjs --sections
  EXPECT: toolbar ux research sections verified
  CWD: ../..
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=d:\harmes\projects\markups; path=5b035fc768dc/76 entries; EXPECT=matched; output-sha256=5d81a219eeef3fb60f22a78b15c880057ae032b11400dc94b2e9026e49782864; output-bytes=38

- [x] G2: every production toolbar control id from index.html is named in the inventory
  CHECK: node scripts/verify-toolbar-ux-research.mjs --inventory
  EXPECT: toolbar ux research inventory verified
  CWD: ../..
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=d:\harmes\projects\markups; path=5b035fc768dc/76 entries; EXPECT=matched; output-sha256=d2e93f79726548dbfdd4d29458dac5f287290b23b401f44b1bdc1f98fcd3bcc8; output-bytes=39

- [x] G3: the document cites independently counted live web sources
  CHECK: node scripts/verify-toolbar-ux-research.mjs --sources
  EXPECT: toolbar ux research sources verified
  CWD: ../..
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=d:\harmes\projects\markups; path=5b035fc768dc/76 entries; EXPECT=matched; output-sha256=db39835c41811afac4c32220c62d770c811752bb9981e1430331ee2ff7a62dd8; output-bytes=37

- [x] G4: production toolbar implementation files are unmodified
  CHECK: node scripts/verify-toolbar-ux-research.mjs --no-code-changes
  EXPECT: toolbar implementation unmodified
  CWD: ../..
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=d:\harmes\projects\markups; path=5b035fc768dc/76 entries; EXPECT=matched; output-sha256=f89b301558bd478848b8320da0a9dce1b8314b35cde71dad37c880a604f1c23a; output-bytes=34
