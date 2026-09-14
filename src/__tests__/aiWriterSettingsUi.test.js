import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UI_JS = resolve(process.cwd(), 'src/features/ai-writer/ui.js');
const INDEX_JS = resolve(process.cwd(), 'src/features/ai-writer/index.js');

describe('AI settings live inside the sidebar', () => {
    const ui = readFileSync(UI_JS, 'utf8');
    const manager = readFileSync(INDEX_JS, 'utf8');

    it('does not open the page-level modal for AI settings', () => {
        expect(ui).not.toMatch(/from ['"].*ui\/modal/);
        expect(ui).not.toMatch(/modal\.open/);
        expect(manager).not.toMatch(/from ['"].*ui\/modal/);
        expect(manager).not.toMatch(/modal\.open/);
    });

    it('renders settings as an in-panel sheet', () => {
        expect(ui).toContain('id="ai-settings-sheet"');
        expect(ui).toContain('class="ai-settings-sheet"');
        expect(ui).toContain('id="ai-settings-body"');
        expect(ui).toMatch(/position:\s*absolute/);
        expect(ui).toMatch(/inset:\s*0/);
    });

    it('shows the sidebar before opening settings when unconfigured', () => {
        expect(manager).toMatch(/this\._doShow\(\)/);
        expect(manager).toMatch(/aiWriterUI\.openSettings\(\)/);
    });
});
