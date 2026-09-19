/**
 * Gate 0 guardrail (Phase 1.2): every EVENTS.* name referenced anywhere in src/
 * must exist in the EVENTS dict. Prevents emit(undefined) silent no-ops.
 * Also locks the four intentional alias pairs so they stay deliberate.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EVENTS } from '../utils/eventBus.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

function collectJs(dir, out = []) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name);
        if (e.isDirectory()) {
            collectJs(f, out);
        } else if (e.name.endsWith('.js')) {
            out.push(f);
        }
    }
    return out;
}

describe('eventBus — Gate 0 guardrail', () => {
    it('no emit(undefined): all referenced EVENTS.* names are defined', () => {
        const missing = new Map();
        for (const f of collectJs(SRC)) {
            // Skip the dict itself (its JSDoc contains a placeholder reference
            // that is not a real event name).
            // Normalize separators: Windows paths use backslashes.
            if (f.replace(/\\/g, '/').endsWith('utils/eventBus.js')) continue;
            const src = readFileSync(f, 'utf8');
            for (const m of src.matchAll(/\bEVENTS\.([A-Z][A-Z0-9_]*)/g)) {
                if (!(m[1] in EVENTS)) {
                    if (!missing.has(m[1])) missing.set(m[1], []);
                    missing.get(m[1]).push(f);
                }
            }
        }
        expect([...missing.entries()]).toEqual([]);
    });

    it('alias pairs are intentional and stay in sync', () => {
        expect(EVENTS.ERROR).toBe(EVENTS.APP_ERROR);
        expect(EVENTS.LINT_COMPLETE).toBe(EVENTS.LINT_COMPLETED);
        expect(EVENTS.EXPORT_COMPLETE).toBe(EVENTS.EXPORT_COMPLETED);
        // NOTE: DOC_SAVED alias removed in Phase 5 (zero references).
        expect('DOC_SAVED' in EVENTS).toBe(false);
    });
});
