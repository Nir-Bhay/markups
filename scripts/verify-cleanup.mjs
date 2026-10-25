// Verify cleanup gates for the small-features round.
// Usage:
//   node scripts/verify-cleanup.mjs                  -> check backup files deleted
//   node scripts/verify-cleanup.mjs --instrumentation -> check debug fetch markers removed
// Each mode runs a positive control (verifies the checker detects a seeded case) before asserting absence.

import { existsSync, readFileSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mode = process.argv.includes('--instrumentation') ? 'instrumentation' : 'backups';
let ok = true;
const msgs = [];

function fail(msg) { ok = false; msgs.push('FAIL: ' + msg); }
function pass(msg) { msgs.push('ok: ' + msg); }

if (mode === 'backups') {
    // Positive control: checker detects a present file.
    const controlDir = mkdtempSync(join(tmpdir(), 'cleanup-control-'));
    const controlFile = join(controlDir, 'index.js.pre-phase2-backup');
    writeFileSync(controlFile, 'control');
    if (existsSync(controlFile)) pass('positive control: present file detected');
    else fail('positive control failed: could not detect a present file');
    rmSync(controlDir, { recursive: true, force: true });

    const backups = [
        'src/main.js.backup',
        'src/features/image-resize/index.js.pre-phase2-backup',
        'src/features/toolbar/index.js.pre-phase2-backup'
    ];
    for (const rel of backups) {
        if (existsSync(join(root, rel))) fail('backup still exists: ' + rel);
        else pass('deleted: ' + rel);
    }
} else {
    // Positive control: detector finds the marker in a seeded temp file.
    const controlDir = mkdtempSync(join(tmpdir(), 'instr-control-'));
    const controlFile = join(controlDir, 'seeded.js');
    writeFileSync(controlFile, "// #region agent log\nfetch('http://127.0.0.1:7909/ingest/x');\n// #endregion\n");
    const controlHit = readFileSync(controlFile, 'utf8').includes('127.0.0.1:7909');
    if (controlHit) pass('positive control: marker detected in seeded file');
    else fail('positive control failed: detector could not detect marker');
    rmSync(controlDir, { recursive: true, force: true });

    const sources = [
        'src/services/shortcuts/index.js',
        'src/features/goals/index.js',
        'src/features/linter/index.js'
    ];
    for (const rel of sources) {
        const text = readFileSync(join(root, rel), 'utf8');
        if (text.includes('127.0.0.1:7909')) fail('instrumentation still present: ' + rel);
        else if (text.includes('#region agent log')) fail('agent log region still present: ' + rel);
        else pass('clean: ' + rel);
    }
    // Also scan the whole src tree for the marker host.
    const { readdirSync, statSync } = await import('node:fs');
    const walk = (dir) => {
        for (const entry of readdirSync(dir)) {
            const p = join(dir, entry);
            const st = statSync(p);
            if (st.isDirectory()) walk(p);
            else if (/\.(js|mjs)$/.test(entry)) {
                if (readFileSync(p, 'utf8').includes('127.0.0.1:7909')) fail('marker found: ' + p);
            }
        }
    };
    walk(join(root, 'src'));
}

console.log(msgs.join('\n'));
if (!ok) { console.error(mode + ' verification FAILED'); process.exit(1); }
console.log(mode + ' verification passed');
