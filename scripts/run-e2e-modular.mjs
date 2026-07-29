#!/usr/bin/env node
/**
 * Cross-platform wrapper for running Playwright against the modular entry.
 * Avoids Unix-only `MARKUPS_ENTRY=modular playwright test` syntax.
 */

import { spawnSync } from 'node:child_process';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npxCommand, ['playwright', 'test'], {
    stdio: 'inherit',
    shell: false,
    env: {
        ...process.env,
        MARKUPS_ENTRY: 'modular'
    }
});

if (result.error) {
    console.error(result.error);
    process.exit(1);
}

process.exit(result.status ?? 1);
