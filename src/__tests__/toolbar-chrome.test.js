/**
 * Toolbar catalog, smart link, and premium chrome.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { hiddenButtons } = vi.hoisted(() => ({ hiddenButtons: [] }));

vi.mock('../features/toolbar/utils.js', () => ({
    insertText: vi.fn(),
    prefixLine: vi.fn(),
    wrapSelection: vi.fn(),
    resolveEditor: vi.fn(() => null),
    getSelection: vi.fn(() => ''),
    insertLink: vi.fn(),
    replaceSelection: vi.fn(),
}));

vi.mock('../features/toolbar/preferences.js', () => ({
    prefs: {
        get hiddenButtons() {
            return hiddenButtons;
        },
        toggleButtonVisibility(id) {
            const index = hiddenButtons.indexOf(id);
            if (index >= 0) hiddenButtons.splice(index, 1);
            else hiddenButtons.push(id);
        },
    },
}));

import {
    DIAGRAM_PRESETS,
    EXTRA_SLASH_COMMANDS,
    slashIds,
} from '../features/toolbar/catalog.js';
import { hostnameFromUrl, smartInsertLink } from '../features/toolbar/smart-link.js';
import { initPremiumToolbarChrome, resetPremiumToolbarChromeForTests } from '../features/toolbar/chrome.js';
import { SLASH_COMMANDS } from '../features/slash-commands/registry.js';
import { getSelection, insertLink, insertText, replaceSelection } from '../features/toolbar/utils.js';

function mountToolbar() {
    document.body.innerHTML = `
        <div id="toolbar">
            <div class="toolbar-group" data-toolbar-id="format">
                <button id="toolbar-bold"></button>
                <button id="toolbar-italic"></button>
                <button id="toolbar-strikethrough"></button>
            </div>
            <div class="toolbar-group toolbar-menu-wrap" data-toolbar-id="heading">
                <button id="toolbar-heading-menu">Heading</button>
                <div class="toolbar-menu" id="toolbar-heading-menu-sheet" hidden>
                    <button class="toolbar-menu-item" id="toolbar-h1" role="menuitem">Heading 1</button>
                    <button class="toolbar-menu-item" id="toolbar-h4" role="menuitem">Heading 4</button>
                </div>
            </div>
            <div class="toolbar-group toolbar-menu-wrap" data-toolbar-id="insert">
                <button id="toolbar-insert-menu">Insert</button>
                <div class="toolbar-menu" id="toolbar-insert-menu-sheet" hidden>
                    <button class="toolbar-menu-item" id="toolbar-hr" role="menuitem">Divider</button>
                    <button class="toolbar-menu-item" id="toolbar-math" role="menuitem">Math</button>
                    <button class="toolbar-menu-item" id="toolbar-diagram-flowchart" role="menuitem">Flow</button>
                </div>
            </div>
            <button id="toolbar-customize">Customize</button>
            <div class="toolbar-menu" id="toolbar-customize-sheet" hidden>
                <label><input type="checkbox" data-hide-id="format" checked> Format</label>
            </div>
        </div>
    `;
}

describe('toolbar catalog', () => {
    it('exposes mermaid presets with insert text', () => {
        expect(DIAGRAM_PRESETS.length).toBeGreaterThanOrEqual(6);
        for (const preset of DIAGRAM_PRESETS) {
            expect(preset.id).toBeTruthy();
            expect(preset.insert).toContain('```mermaid');
        }
    });

    it('registers extra slash commands used by Insert', () => {
        const ids = slashIds();
        expect(ids).toEqual(expect.arrayContaining([
            'math', 'math-block', 'mermaid', 'footnote', 'callout',
            'frontmatter', 'cite', 'h4', 'h5', 'h6',
        ]));
        const slashIdsFromRegistry = SLASH_COMMANDS.map((cmd) => cmd.id);
        for (const cmd of EXTRA_SLASH_COMMANDS) {
            expect(slashIdsFromRegistry).toContain(cmd.id);
        }
    });
});

describe('smartInsertLink', () => {
    beforeEach(() => {
        getSelection.mockReset();
        insertLink.mockReset();
        replaceSelection.mockReset();
    });

    it('turns a selected URL into a hostname markdown link', () => {
        getSelection.mockReturnValue('https://www.example.com/docs');
        smartInsertLink();
        expect(replaceSelection).toHaveBeenCalledWith('[example.com](https://www.example.com/docs)');
        expect(insertLink).not.toHaveBeenCalled();
    });

    it('falls back to the link insert when selection is not a URL', () => {
        getSelection.mockReturnValue('hello');
        smartInsertLink();
        expect(insertLink).toHaveBeenCalled();
        expect(replaceSelection).not.toHaveBeenCalled();
    });

    it('parses hostnames safely', () => {
        expect(hostnameFromUrl('https://www.github.com/org/repo')).toBe('github.com');
        expect(hostnameFromUrl('not-a-url')).toBe('link');
    });
});

describe('premium toolbar chrome', () => {
    beforeEach(() => {
        hiddenButtons.length = 0;
        resetPremiumToolbarChromeForTests();
        insertText.mockReset();
        mountToolbar();
        initPremiumToolbarChrome();
    });

    it('opens the heading menu and keeps other chrome compact', () => {
        document.getElementById('toolbar-heading-menu').click();
        const menu = document.getElementById('toolbar-heading-menu-sheet');
        expect(menu.classList.contains('is-open')).toBe(true);
        expect(menu.hasAttribute('hidden')).toBe(false);
    });

    it('binds the previously dead divider control', () => {
        document.getElementById('toolbar-hr').click();
        expect(insertText).toHaveBeenCalledWith('\n---\n');
    });

    it('inserts a mermaid flowchart from the catalog', () => {
        document.getElementById('toolbar-diagram-flowchart').click();
        expect(insertText).toHaveBeenCalledWith(DIAGRAM_PRESETS[0].insert);
    });

    it('hides a group from Customize', () => {
        const input = document.querySelector('input[data-hide-id="format"]');
        input.checked = false;
        input.dispatchEvent(new Event('change'));
        expect(document.querySelector('[data-toolbar-id="format"]').classList.contains('toolbar-pref-hidden')).toBe(true);
    });
});
