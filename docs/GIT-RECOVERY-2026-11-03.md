# Original Git history: safe access and recovery

The history was preserved, not lost. Normal `git` commands inside `E:/markups/markups` were finding the enclosing workspace repository at `E:/markups/.git` (Initial commit, no remote). The actual project repository is hidden at `E:/markups/markups/.git_disabled`.

## Verified on 2026-11-03

- Original HEAD: `b5d5c666330c908154b4b6278fb9105097ecb03a`.
- Original branch: `Nir-Bhay/sync-main-seo-geo-2026-10-25`.
- Original origin: `https://github.com/Nir-Bhay/markups.git`.
- Metadata connectivity check passed; dangling commits/trees were reported, which are not missing-object corruption and were preserved in the metadata backup.
- Fetch from the verified origin succeeded. HEAD is 40 commits ahead of origin/main and zero behind, plus extensive local edits and new files.
- Original metadata backup: `E:/markups-recovery/2026-11-03-original-git/git-metadata`.
- Tracked working-tree binary patch at backup time: `E:/markups-recovery/2026-11-03-original-git/tracked-working-tree.patch`. This patch does not include untracked files; they remain in the current working directory. It is not a full application backup.

## Small steps to inspect safely

Run in PowerShell from `E:/markups/markups`:

```powershell
# Read status using the original project metadata
./scripts/git-original.ps1 status --short

# Confirm origin and current branch
./scripts/git-original.ps1 remote -v
./scripts/git-original.ps1 branch --show-current

# Fetch objects/remote refs, without merging or replacing local files
./scripts/git-original.ps1 fetch origin

# Compare committed history with main (left=behind, right=ahead)
./scripts/git-original.ps1 rev-list --left-right --count origin/main...HEAD

# Inspect local edits and production-to-working-tree tracked differences
./scripts/git-original.ps1 diff --stat
./scripts/git-original.ps1 diff 9458092d60aa678e2bc8253f205bb56717a3fca6 -- src
```

The helper explicitly selects preserved metadata and the real working directory. It is not a restricted Git interface: review any write command before using it. No reset/clean/stash, metadata rename, remote replacement, branch deletion, push or production change was used to recover access. The enclosing workspace Git configuration was left intact. `.git_disabled/` is ignored to prevent accidentally staging Git internals in the original repository.

Before a release, review tracked and untracked files separately, exclude secrets/build outputs, stage only reviewed source, run the release checks on that exact candidate, and commit on the existing feature branch. Push/merge/deploy requires a separate reviewed release action. Do not add an origin to the enclosing Initial-commit repository or force-push it over the project history.

If standard Git discovery is needed later, first understand why the app disabled nested metadata. A separate clone/worktree with reviewed source copied into it is safer than renaming Git directories underneath an active session. Never run a hard reset to make the working tree resemble a remote.
