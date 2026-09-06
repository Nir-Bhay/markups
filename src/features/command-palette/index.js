/**
 * Command Palette Module
 * Provides a global command palette (Ctrl+Shift+P) for fast navigation.
 * @module features/command-palette
 */

import { COMMANDS } from './registry.js';
import { render, open, dispose } from './ui.js';

class CommandPalette {
    constructor() {
        this.initialized = false;
        this.commands = COMMANDS;
    }

    initialize() {
        if (this.initialized) return;
        render();

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                open();
            }
        });

        this.initialized = true;
    }

    dispose() {
        dispose();
        this.initialized = false;
    }
}

export { CommandPalette };
export { COMMANDS } from './registry.js';
