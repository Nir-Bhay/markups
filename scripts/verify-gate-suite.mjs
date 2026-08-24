#!/usr/bin/env node
/* unlazy G2: full unit suite green. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const r = spawnSync('npx', ['vitest', 'run'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
const out = `${r.stdout || ''}\n${r.stderr || ''}`;
if (r.status !== 0 || /failed|✗|FAIL/.test(out)) {
    console.error('suite gate FAILED\n' + out.slice(-1000));
    process.exit(1);
}
console.log('suite gate passed');
