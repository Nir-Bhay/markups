#!/usr/bin/env node
/* unlazy G4: the core/markdown emoji flatten fix is committed on review/integration. */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mdPath = join(root, 'src', 'core', 'markdown', 'index.js');
const src = readFileSync(mdPath, 'utf8');

const flattenOk = src.includes('...markedEmoji(emojiMarkedOptions).extensions');
const staleNested = src.includes('markedEmoji(emojiMarkedOptions),\n                }\n            }\n        )');

// Require the flatten pattern and forbid the old nested-wrapper pattern.
if (!flattenOk || staleNested) {
    console.error('emoji commit gate FAILED: emoji extension not flattened correctly in core/markdown/index.js');
    process.exit(1);
}

// Confirm it's committed (no uncommitted diff for that file).
const st = spawnSync('git', ['status', '--porcelain', 'src/core/markdown/index.js'], { cwd: root, encoding: 'utf8' });
if (st.status !== 0 || (st.stdout || '').trim() !== '') {
    console.error('emoji commit gate FAILED: src/core/markdown/index.js has uncommitted changes');
    process.exit(1);
}
console.log('emoji commit gate passed');
