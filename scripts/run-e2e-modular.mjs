#!/usr/bin/env node
/**
 * Run the modular entry through the lifecycle-safe Playwright/Vite wrapper.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = spawnSync(process.execPath, [join(root, 'scripts', 'run-e2e.mjs'), ...process.argv.slice(2)], {
    cwd: root,
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
