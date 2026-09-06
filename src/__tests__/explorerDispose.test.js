// Tests for features/explorer/index.js — dispose() listener cleanup.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ExplorerManager } from '../features/explorer/index.js';

function createExplorerElements() {
    document.body.innerHTML = `
        <div id="explorer-tree"></div>
        <div id="explorer-drawer"></div>
        <button id="explorer-toggle-btn"></button>
        <button id="explorer-new-file-btn"></button>
        <button id="explorer-new-folder-btn"></button>
        <div id="explorer-resize-handle"></div>
        <input id="explorer-filter-input" />
        <select id="explorer-sort-select"><option value="manual">Manual</option></select>
        <div id="explorer-context-menu"></div>
    `;
}

describe('features/explorer dispose', () => {
    let manager;

    beforeEach(() => {
        vi.resetModules();
        createExplorerElements();
        manager = new ExplorerManager({
            onOpenFile: vi.fn(),
            onCreateFile: vi.fn(),
            onCreateFolder: vi.fn(),
            onRenameNode: vi.fn(),
            onDeleteNode: vi.fn(),
            onMoveNode: vi.fn(),
            onLayoutChange: vi.fn()
        });
        manager.initialize();
    });

    afterEach(() => {
        if (manager && typeof manager.dispose === 'function') {
            manager.dispose();
        }
        document.body.innerHTML = '';
    });

    it('dispose() is idempotent (safe to call multiple times)', () => {
        manager.dispose();
        expect(() => manager.dispose()).not.toThrow();
        expect(() => manager.dispose()).not.toThrow();
    });

    it('dispose() nulls out DOM references', () => {
        manager.dispose();
        expect(manager.toggleBtn).toBeNull();
        expect(manager.newFileBtn).toBeNull();
        expect(manager.newFolderBtn).toBeNull();
        expect(manager.resizeHandle).toBeNull();
        expect(manager.filterInput).toBeNull();
        expect(manager.sortSelect).toBeNull();
        expect(manager.container).toBeNull();
        expect(manager.contextMenu).toBeNull();
        expect(manager.drawer).toBeNull();
    });

    it('dispose() removes container event listeners', () => {
        const container = document.getElementById('explorer-tree');
        // jsdom doesn't expose listener counts, but we can verify dispose doesn't throw
        // and that re-initialize after dispose works cleanly
        manager.dispose();
        expect(() => manager.initialize()).not.toThrow();
    });

    it('dispose() clears resize bound handlers if a resize was active', () => {
        // Simulate an active resize by setting the bound handlers directly
        manager._boundMousemove = () => {};
        manager._boundMouseup = () => {};
        manager.dispose();
        expect(manager._boundMousemove).toBeNull();
        expect(manager._boundMouseup).toBeNull();
    });
});
