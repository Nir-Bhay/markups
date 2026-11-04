import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(mkdtempSync(join(tmpdir(), 'markups-built-')), 'dist');
const port = Number(process.env.PLAYWRIGHT_BUILT_PORT || 4593);
const url = `http://127.0.0.1:${port}`;
const env = { ...process.env, MARKUPS_ENTRY: '', PLAYWRIGHT_BUILT: '1', PLAYWRIGHT_BUILT_URL: url, PLAYWRIGHT_VIDEO: 'off' };
let server;
let testProcess;
function child(file, args, extra = {}) {
    return spawn(process.execPath, [join(root, file), ...args], { cwd: root, env, stdio: 'inherit', windowsHide: true, ...extra });
}
function completed(process) {
    return new Promise((resolve, reject) => {
        process.once('error', reject);
        process.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Child failed: ${code ?? signal}`)));
    });
}
const stop = () => { testProcess?.kill(); server?.kill(); };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
try {
    console.log(`[built-e2e] Building isolated production artifact: ${output}`);
    await completed(child('scripts/prerender-landing.mjs', []));
    await completed(child('node_modules/vite/bin/vite.js', ['build', '--outDir', output, '--emptyOutDir']));
    if (!/src="\/assets\/main-[^"]+\.js"/.test(readFileSync(join(output, 'index.html'), 'utf8'))) {
        throw new Error('Expected a compiled production entry, not the dev/modular shell.');
    }
    server = child('node_modules/vite/bin/vite.js', ['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort', '--outDir', output]);
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
        if (server.exitCode !== null) throw new Error('Owned preview failed to start.');
        try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* wait for owned preview */ }
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('Built preview did not become available.');
    testProcess = child('node_modules/@playwright/test/cli.js', ['test', '--config', 'playwright.built.config.js', ...process.argv.slice(2)]);
    await completed(testProcess);
} catch (error) {
    console.error(`[built-e2e] ${error.message}`);
    process.exitCode = 1;
} finally {
    stop();
    console.log(`[built-e2e] Artifact retained for inspection: ${output}`);
}
