#!/usr/bin/env node
/**
 * Run Playwright with a directly managed Vite process.
 *
 * Playwright's built-in webServer shutdown uses a Windows shell process tree.
 * Starting Vite as a direct child lets this wrapper reliably await and close
 * only the server process it owns, while still reusing an already-running app.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const HOST = '127.0.0.1';
const PORT = Number(process.env.PLAYWRIGHT_PORT || 4173);
const BASE_URL = `http://${HOST}:${PORT}/`;
const VITE_CLI = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PLAYWRIGHT_CLI = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
const STARTUP_TIMEOUT_MS = 120_000;
const SERVER_CLOSE_TIMEOUT_MS = 5_000;

let viteProcess = null;
let ownsViteProcess = false;
let playwrightProcess = null;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function isServerAvailable() {
    try {
        const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(10_000) });
        return response.ok;
    } catch {
        return false;
    }
}

function waitForChild(child) {
    return new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => resolve({ code, signal }));
    });
}

async function startViteIfNeeded() {
    if (await isServerAvailable()) {
        process.stdout.write(`[e2e] Reusing ${BASE_URL}\n`);
        return;
    }

    process.stdout.write(`[e2e] Starting Vite at ${BASE_URL}\n`);
    viteProcess = spawn(process.execPath, [VITE_CLI, '--host', HOST, '--port', String(PORT), '--strictPort'], {
        cwd: ROOT,
        env: { ...process.env },
        stdio: 'inherit',
        windowsHide: true
    });
    ownsViteProcess = true;
    const serverExit = waitForChild(viteProcess);
    const startupStartedAt = Date.now();

    while (Date.now() - startupStartedAt < STARTUP_TIMEOUT_MS) {
        if (viteProcess.exitCode !== null) {
            const result = await serverExit;
            throw new Error(`Vite exited before becoming ready (code ${result.code ?? result.signal}).`);
        }
        if (await isServerAvailable()) return;
        await delay(250);
    }

    throw new Error(`Vite did not become available at ${BASE_URL} within ${STARTUP_TIMEOUT_MS}ms.`);
}

async function stopOwnedVite() {
    if (!ownsViteProcess || !viteProcess || viteProcess.exitCode !== null) return;

    process.stdout.write('[e2e] Stopping owned Vite server\n');
    const closed = waitForChild(viteProcess);
    viteProcess.kill();
    const result = await Promise.race([
        closed.then(value => ({ closed: true, value })),
        delay(SERVER_CLOSE_TIMEOUT_MS).then(() => ({ closed: false }))
    ]);

    if (!result.closed && viteProcess.exitCode === null) {
        // The PID belongs to the direct child created above; never terminate
        // an unrelated server or the user's already-running preview.
        viteProcess.kill('SIGKILL');
        await Promise.race([closed, delay(1_000)]);
    }
}

async function runPlaywright() {
    // A reused server may have been started for the other entry. Never label a
    // production run as modular (or vice versa) just because its port responds.
    const response = await fetch(BASE_URL);
    const html = await response.text();
    const expectedEntry = process.env.MARKUPS_ENTRY === 'modular' ? 'main.modular.js' : 'main.js';
    const expectedPattern = new RegExp(`src=["']/src/${expectedEntry.replaceAll('.', '\\.')}(?:[?"'])`);
    if (!response.ok || !expectedPattern.test(html)) {
        throw new Error(`Server at ${BASE_URL} is not serving the requested ${expectedEntry} entry. Use a separate PLAYWRIGHT_PORT or restart that server.`);
    }
    playwrightProcess = spawn(process.execPath, [PLAYWRIGHT_CLI, 'test', ...process.argv.slice(2)], {
        cwd: ROOT,
        env: {
            ...process.env,
            PLAYWRIGHT_PORT: String(PORT),
            PLAYWRIGHT_EXTERNAL_SERVER: '1'
        },
        stdio: 'inherit',
        windowsHide: true
    });
    const result = await waitForChild(playwrightProcess);
    if (result.signal) return 1;
    return result.code ?? 1;
}

let exitCode = 1;
try {
    await startViteIfNeeded();
    exitCode = await runPlaywright();
} catch (error) {
    process.stderr.write(`[e2e] ${error.message}\n`);
} finally {
    await stopOwnedVite();
}

process.exitCode = exitCode;
