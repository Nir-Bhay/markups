#!/usr/bin/env node
/**
 * End-to-end repository health verification.
 *
 * Checks the exact concerns covered by the build/security/modular audit:
 * - no npm audit vulnerabilities
 * - unit tests pass
 * - production build succeeds without Vite chunk warnings
 * - modular proof build succeeds without Vite chunk warnings
 */

import { rmSync, rmdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const warningPatterns = [
    /Circular chunk:/i,
    /Some chunks are larger than/i,
    /\(!\)/
];

const tempBuildDirs = [
    '.tmp/verify-dist-production',
    '.tmp/verify-dist-modular'
];

function cleanupTempBuildDirs() {
    for (const dir of tempBuildDirs) {
        rmSync(dir, { recursive: true, force: true });
    }

    try {
        rmdirSync('.tmp');
    } catch {
        // Keep non-empty .tmp directories created by other tools; .gitignore covers them.
    }
}

function runNpm(args, options = {}) {
    const label = `npm ${args.join(' ')}`;
    process.stdout.write(`\n▶ ${label}\n`);

    const result = spawnSync(npmCommand, args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        shell: false,
        ...options
    });

    const output = `${result.stdout || ''}${result.stderr || ''}`;

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0 && !options.allowFailure) {
        process.stdout.write(output);
        throw new Error(`${label} failed with exit code ${result.status}`);
    }

    return { ...result, output };
}

function assertCleanBuild(label, output) {
    const matchedWarning = warningPatterns.find((pattern) => pattern.test(output));
    if (matchedWarning) {
        process.stdout.write(output);
        throw new Error(`${label} emitted a build warning matching ${matchedWarning}`);
    }

    assertChunkBudgets(label, output);
}

function assertChunkBudgets(label, output) {
    const chunkPattern = /(?:^|\n)[^\n]*\/assets\/([^\s]+\.js)\s+([\d,.]+) kB/g;
    const budgetViolations = [];
    let matched = false;
    let match;

    while ((match = chunkPattern.exec(output)) !== null) {
        matched = true;
        const [, fileName, rawSize] = match;
        const sizeKb = Number.parseFloat(rawSize.replace(/,/g, ''));
        const maxKb = fileName.startsWith('monaco-editor-') ? 2400 : 850;

        if (Number.isFinite(sizeKb) && sizeKb > maxKb) {
            budgetViolations.push(`${fileName}: ${sizeKb.toFixed(2)} kB > ${maxKb} kB`);
        }
    }

    if (!matched) {
        process.stdout.write(output);
        throw new Error(`${label} did not report any JS chunk sizes`);
    }

    if (budgetViolations.length > 0) {
        process.stdout.write(output);
        throw new Error(`${label} exceeded JS chunk budgets:\n${budgetViolations.join('\n')}`);
    }
}

function verifyAudit() {
    const result = runNpm(['audit', '--json'], { allowFailure: true });

    let audit;
    try {
        audit = JSON.parse(result.stdout || '{}');
    } catch (error) {
        process.stdout.write(result.output);
        throw new Error(`Unable to parse npm audit JSON: ${error.message}`);
    }

    const total = audit?.metadata?.vulnerabilities?.total ?? 0;
    if (total > 0 || result.status !== 0) {
        process.stdout.write(JSON.stringify(audit, null, 2));
        process.stdout.write('\n');
        throw new Error(`npm audit found ${total} vulnerabilities`);
    }

    process.stdout.write('  ✓ npm audit found 0 vulnerabilities\n');
}

function verifyCommand(args, label, { checkBuildWarnings = false } = {}) {
    const result = runNpm(args);

    if (checkBuildWarnings) {
        assertCleanBuild(label, result.output);
    }

    process.stdout.write(`  ✓ ${label} passed\n`);
}

try {
    cleanupTempBuildDirs();

    verifyAudit();
    verifyCommand(['test'], 'unit tests');
    verifyCommand(
        ['run', 'build', '--', '--outDir', tempBuildDirs[0]],
        'production build',
        { checkBuildWarnings: true }
    );
    verifyCommand(
        ['run', 'build:modular', '--', '--outDir', tempBuildDirs[1]],
        'modular proof build',
        { checkBuildWarnings: true }
    );

    process.stdout.write('\n✅ Repository health verification passed.\n');
} catch (error) {
    process.stderr.write(`\n❌ Repository health verification failed: ${error.message}\n`);
    process.exit(1);
} finally {
    cleanupTempBuildDirs();
}
