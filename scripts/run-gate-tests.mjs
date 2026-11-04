// Gate test runner: wraps vitest and prints a success-only token on green run.
// Usage: node scripts/run-gate-tests.mjs [vitest args...]
// Prints "ALL TESTS GREEN" only if the test process exits 0 AND no failure words appear in output.

import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['run'];
const result = spawnSync('npx', ['vitest', ...args], {
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
});
const out = (result.stdout || '') + (result.stderr || '');
console.log(out);

const failedWords = /\bfail(ed|ures)?\b|\bERROR\b/i.test(out);
if (result.status === 0 && !failedWords) {
    console.log('ALL TESTS GREEN');
    process.exit(0);
}
console.error('GATE TESTS FAILED (exit=' + result.status + ')');
process.exit(1);
