/**
 * Tests for wrapSelection (Phase 3.1) — toggle must only unwrap when affixes
 * sit exactly adjacent to the selection. Boundary-crossing selections wrap
 * (non-destructive) instead of eating live markers.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { wrapSelection } from '../features/toolbar/utils.js';

// Faithful minimal Monaco model: 1-based lines/columns, '\n'-joined ranges.
function makeEditor(initialLines, selection) {
    const lines = [...initialLines];
    const edits = [];
    const api = {
        edits,
        getSelection: () => ({ ...selection }),
        getModel: () => ({
            getLineContent: (n) => lines[n - 1] ?? '',
            getValueInRange: (r) => {
                if (r.startLineNumber === r.endLineNumber) {
                    return (lines[r.startLineNumber - 1] ?? '').slice(r.startColumn - 1, r.endColumn - 1);
                }
                const parts = [];
                parts.push((lines[r.startLineNumber - 1] ?? '').slice(r.startColumn - 1));
                for (let n = r.startLineNumber + 1; n < r.endLineNumber; n++) {
                    parts.push(lines[n - 1] ?? '');
                }
                parts.push((lines[r.endLineNumber - 1] ?? '').slice(0, r.endColumn - 1));
                return parts.join('\n');
            }
        }),
        executeEdits: (_src, list) => {
            for (const e of list) {
                edits.push(e);
                // Apply single-range edits back to lines (supports tests below).
                const before = api.getModel().getValueInRange({
                    startLineNumber: 1, startColumn: 1,
                    endLineNumber: e.range.startLineNumber, endColumn: e.range.startColumn
                });
                const after = api.getModel().getValueInRange({
                    startLineNumber: e.range.endLineNumber, startColumn: e.range.endColumn,
                    endLineNumber: lines.length, endColumn: (lines[lines.length - 1] ?? '').length + 1
                });
                const merged = (before + e.text + after).split('\n');
                lines.length = 0;
                lines.push(...merged);
            }
        },
        setSelection: (s) => edits.push({ setSelection: s }),
        focus: () => {}
    };
    return { lines, api };
}

beforeEach(() => {
    window.editor = null;
});

describe('wrapSelection', () => {
    it('wraps a single-line selection', () => {
        const { lines, api } = makeEditor(['hello'], {
            startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6
        });
        window.editor = api;
        wrapSelection('**', '**');
        expect(lines).toEqual(['**hello**']);
    });

    it('unwraps exact adjacent markers (single line)', () => {
        const { lines, api } = makeEditor(['**hello**'], {
            startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 8
        });
        window.editor = api;
        wrapSelection('**', '**');
        expect(lines).toEqual(['hello']);
    });

    it('wraps a multi-line block', () => {
        const { lines, api } = makeEditor(['line1', 'line2'], {
            startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 6
        });
        window.editor = api;
        wrapSelection('**', '**');
        expect(lines).toEqual(['**line1', 'line2**']);
    });

    it('unwraps an exactly-wrapped multi-line block', () => {
        const { lines, api } = makeEditor(['**line1', 'line2**'], {
            startLineNumber: 1, startColumn: 3, endLineNumber: 2, endColumn: 6
        });
        window.editor = api;
        wrapSelection('**', '**');
        expect(lines).toEqual(['line1', 'line2']);
    });

    // Regression: old blob-matching ate the outer markers of `**a**`/`**b**`.
    it('does not eat markers on boundary-crossing selections', () => {
        const { lines, api } = makeEditor(['**x', 'yz**'], {
            startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 3
        });
        window.editor = api;
        wrapSelection('**', '**');
        // Must wrap (non-destructive), never strip to '**x\nyz'.
        expect(lines).toEqual(['****x', 'yz****']);
    });

    it('places cursor on placeholder for empty selection', () => {
        const { api } = makeEditor([''], {
            startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1
        });
        window.editor = api;
        wrapSelection('**', '**');
        const sel = api.edits.find((e) => e.setSelection)?.setSelection;
        expect(sel).toEqual({
            startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 7
        });
    });
});
