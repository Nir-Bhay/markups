#!/usr/bin/env node
/* unlazy G1: typing must not re-fetch a reused preview video's metadata. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const r = spawnSync('npx', ['vitest', 'run', 'src/__tests__/videoEmbed.test.js'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32'
});
const out = `${r.stdout || ''}\n${r.stderr || ''}`;
const failed = /failed|✗|FAIL/.test(out);
if (r.status !== 0 || failed || !/passed/.test(out)) {
    console.error('video reuse gate FAILED\n' + out.slice(-800));
    process.exit(1);
}
console.log('video reuse gate passed');
