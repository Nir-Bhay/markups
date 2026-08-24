#!/usr/bin/env node
/* unlazy G3: production build clean. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const r = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
const out = `${r.stdout || ''}\n${r.stderr || ''}`;
if (r.status !== 0 || !/built in/.test(out)) {
    console.error('build gate FAILED\n' + out.slice(-1200));
    process.exit(1);
}
console.log('build gate passed');
