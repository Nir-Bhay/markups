/**
 * Command Palette UI
 * Renders and controls the command palette modal.
 * @module features/command-palette
 */

import { COMMANDS } from './registry.js';

let modal = null;
let input = null;
let list = null;
let activeIndex = -1;
let filteredCommands = [];
const _onExecute = null;

/**
 * Render the command palette modal DOM.
 */
function render() {
    if (modal) return;

    modal = document.createElement('div');
    modal.className = 'command-palette-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Command palette');
    modal.innerHTML = `
        <div class="command-palette-backdrop"></div>
        <div class="command-palette-panel">
            <div class="command-palette-input-wrap">
                <span class="material-symbols-outlined command-palette-icon">search</span>
                <input type="text" class="command-palette-input" placeholder="Type a command..." autocomplete="off" />
                <kbd class="command-palette-esc" title="Close">ESC</kbd>
            </div>
            <div class="command-palette-list" role="listbox"></div>
        </div>
    `;

    document.body.appendChild(modal);

    input = modal.querySelector('.command-palette-input');
    list = modal.querySelector('.command-palette-list');

    input.addEventListener('input', () => {
        updateList(input.value);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigate(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigate(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            executeActive();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            dispose();
        }
    });

    modal.querySelector('.command-palette-backdrop').addEventListener('click', () => {
        dispose();
    });

    modal.querySelector('.command-palette-esc').addEventListener('click', () => {
        dispose();
    });
}

/**
 * Simple fuzzy filter: match if all query chars appear in order in the label.
 */
function fuzzyMatch(query, text) {
    if (!query) return true;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) qi++;
    }
    return qi === q.length;
}

/**
 * Update the visible command list based on query.
 */
function updateList(query) {
    filteredCommands = COMMANDS.filter((cmd) => fuzzyMatch(query, cmd.label));
    activeIndex = filteredCommands.length > 0 ? 0 : -1;
    renderList();
}

/**
 * Navigate the active command with arrow keys.
 */
function navigate(delta) {
    if (filteredCommands.length === 0) return;
    activeIndex = (activeIndex + delta + filteredCommands.length) % filteredCommands.length;
    renderList();
}

/**
 * Render command items.
 */
function renderList() {
    if (!list) return;
    list.innerHTML = '';

    if (filteredCommands.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'command-palette-empty';
        empty.textContent = 'No commands found';
        list.appendChild(empty);
        return;
    }

    filteredCommands.forEach((cmd, idx) => {
        const item = document.createElement('div');
        item.className = 'command-palette-item' + (idx === activeIndex ? ' active' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
        item.innerHTML = `
            <span class="command-palette-label">${escapeHtml(cmd.label)}</span>
            <span class="command-palette-meta">
                <span class="command-palette-group">${escapeHtml(cmd.group)}</span>
                ${cmd.shortcut ? `<kbd class="command-palette-shortcut">${escapeHtml(cmd.shortcut)}</kbd>` : ''}
            </span>
        `;
        item.addEventListener('mouseenter', () => {
            activeIndex = idx;
            renderList();
        });
        item.addEventListener('click', () => {
            executeCommand(cmd);
        });
        list.appendChild(item);
    });
}

/**
 * Execute the currently active command.
 */
function executeActive() {
    if (activeIndex >= 0 && activeIndex < filteredCommands.length) {
        executeCommand(filteredCommands[activeIndex]);
    }
}

/**
 * Run a command action and close the palette.
 */
function executeCommand(cmd) {
    if (typeof cmd.action === 'function') {
        try {
            cmd.action();
        } catch (err) {
            console.error('Command palette action failed:', err);
        }
    }
    dispose();
}

/**
 * Open the command palette.
 */
function open() {
    if (!modal) render();
    modal.classList.add('active');
    input.value = '';
    updateList('');
    input.focus();
    activeIndex = 0;
    renderList();
}

/**
 * Close and destroy the command palette.
 */
function dispose() {
    if (modal) {
        modal.classList.remove('active');
        input.value = '';
        filteredCommands = [];
        activeIndex = -1;
    }
}

/**
 * Tiny HTML escaper (avoid pulling in a new dependency).
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Alias for dispose() so tests can call ui.close() */
function close() {
    dispose();
}

export { render, open, close, dispose };
