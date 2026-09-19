/**
 * Vim keybindings for the modular app (ported from the proven legacy path in
 * main.js `applyKeybindingsSetting`: dynamic `monaco-vim` import, status
 * element, dispose-safe). Preference persists via STORAGE_KEYS.KEYBINDINGS.
 * @module features/vim
 */

import { editorService } from '../../core/editor/index.js';
import { storageService } from '../../core/storage/index.js';
import { STORAGE_KEYS } from '../../core/storage/keys.js';

let vimMode = null;

export function isVimEnabled() {
    try {
        return storageService.get(STORAGE_KEYS.KEYBINDINGS) === 'vim';
    } catch {
        return false;
    }
}

export function setVimEnabled(enabled) {
    try {
        storageService.set(STORAGE_KEYS.KEYBINDINGS, enabled ? 'vim' : 'default');
    } catch { /* ignore */ }
}

/**
 * Apply the stored keybinding preference to a Monaco editor instance.
 * @param {any} [editor] - defaults to the shared editorService editor
 * @param {HTMLElement|null} [statusEl] - `#vim-status`-style element, optional
 * @returns {Promise<boolean>} True when vim mode is active afterwards
 */
export async function applyVimPreference(editor = null, statusEl = null) {
    const target = editor || editorService.getEditor();
    if (vimMode) {
        try { vimMode.dispose(); } catch (_e) { /* ignore */ }
        vimMode = null;
    }
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.add('hidden');
    }
    if (!isVimEnabled() || !target) return false;
    let initVimMode;
    try {
        const mod = await import('monaco-vim');
        initVimMode = mod.initVimMode || mod.default?.initVimMode || mod.default;
    } catch (_e) {
        setVimEnabled(false);
        return false;
    }
    if (typeof initVimMode !== 'function') {
        setVimEnabled(false);
        return false;
    }
    try {
        vimMode = initVimMode(target, statusEl);
        statusEl?.classList.remove('hidden');
        return true;
    } catch (_e) {
        setVimEnabled(false);
        return false;
    }
}

/** Toggle vim mode and re-apply. */
export async function toggleVim(editor = null, statusEl = null) {
    setVimEnabled(!isVimEnabled());
    return applyVimPreference(editor, statusEl);
}

/** Dispose the active vim binding (test/app teardown). */
export function disposeVim() {
    if (vimMode) {
        try { vimMode.dispose(); } catch (_e) { /* ignore */ }
        vimMode = null;
    }
}
