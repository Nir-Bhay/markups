/**
 * Slash Commands Manager
 * Notion-style / insertion menu for Monaco editor
 * @module features/slash-commands
 */

import { SLASH_COMMANDS } from './registry.js';
import { escapeHtml } from '../../utils/escape-html.js';

const MENU_ID = 'slash-menu';

class SlashCommandsManager {
    static instance = null;

    constructor() {
        if (SlashCommandsManager.instance) {
            return SlashCommandsManager.instance;
        }

        this.editor = null;
        this.menu = null;
        this.visible = false;
        this.selectedIndex = 0;
        this.filteredCommands = [...SLASH_COMMANDS];
        this.triggerRange = null; // Range of the slash trigger for replacement
        this._boundKeydown = null;
        this._boundContentChange = null;
        this._boundClick = null;

        SlashCommandsManager.instance = this;
    }

    /**
     * Initialize the slash commands manager
     * @param {Object} editorInstance - Monaco editor instance
     */
    initialize(editorInstance) {
        if (this.editor) return; // Already initialized

        this.editor = editorInstance;

        // Create menu element if it doesn't exist in DOM
        this.menu = document.getElementById(MENU_ID);
        if (!this.menu) {
            this.menu = document.createElement('div');
            this.menu.id = MENU_ID;
            this.menu.className = 'slash-menu';
            this.menu.style.display = 'none';
            this.menu.setAttribute('role', 'listbox');
            this.menu.setAttribute('aria-label', 'Slash commands');
            document.body.appendChild(this.menu);
        }

        // Bind event handlers
        this._boundKeydown = (e) => this._handleKeydown(e);
        this._boundContentChange = (e) => this._handleContentChange(e);
        this._boundClick = (e) => this._handleDocumentClick(e);

        // Editor content change listener
        this.editor.onDidChangeModelContent(this._boundContentChange);

        // Document-level listeners for dismissing
        document.addEventListener('keydown', this._boundKeydown, true);
        document.addEventListener('click', this._boundClick, true);
    }

    /**
     * Show the slash commands menu
     * @param {Object} triggerRange - Monaco range of the / trigger
     */
    show(triggerRange) {
        if (!this.menu || !this.editor) return;

        this.triggerRange = triggerRange;
        this.selectedIndex = 0;
        this.filteredCommands = [...SLASH_COMMANDS];
        this._render();

        // Position near cursor
        this._positionMenu();
        this.menu.style.display = 'block';
        this.visible = true;
        this.menu.classList.add('visible');
    }

    /**
     * Hide the slash commands menu
     */
    hide() {
        if (!this.menu) return;

        this.menu.style.display = 'none';
        this.menu.classList.remove('visible');
        this.visible = false;
        this.triggerRange = null;
        this.selectedIndex = 0;
        this.filteredCommands = [...SLASH_COMMANDS];
    }

    /**
     * Dispose the manager and clean up all resources
     */
    dispose() {
        this.hide();

        if (this._boundKeydown) {
            document.removeEventListener('keydown', this._boundKeydown, true);
            this._boundKeydown = null;
        }
        if (this._boundContentChange && this.editor) {
            this.editor.onDidChangeModelContent(this._boundContentChange);
            this._boundContentChange = null;
        }
        if (this._boundClick) {
            document.removeEventListener('click', this._boundClick, true);
            this._boundClick = null;
        }

        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }

        this.editor = null;
        SlashCommandsManager.instance = null;
    }

    /**
     * Handle editor content changes
     * @param {Object} e - Monaco content change event
     */
    _handleContentChange(e) {
        if (!this.editor) return;

        const lastChange = e.changes[e.changes.length - 1];
        if (!lastChange) return;

        const text = lastChange.text;

        // If user typed /, show menu
        if (text === '/' && this._isAtLineStartOrAfterSpace()) {
            this.triggerRange = this.editor.getSelection();
            this.filteredCommands = [...SLASH_COMMANDS];
            this.selectedIndex = 0;
            this._render();
            this._positionMenu();
            this.menu.style.display = 'block';
            this.visible = true;
            this.menu.classList.add('visible');
            return;
        }

        // If menu is open, filter commands based on text after /
        if (this.visible && this.triggerRange) {
            const currentRange = this.editor.getSelection();
            if (currentRange && currentRange.startLineNumber === this.triggerRange.startLineNumber) {
                const lineContent = this.editor.getModel().getLineContent(currentRange.startLineNumber);
                const slashIndex = lineContent.lastIndexOf('/', currentRange.startColumn - 1);
                if (slashIndex >= 0) {
                    const query = lineContent.slice(slashIndex + 1, currentRange.startColumn - 1).toLowerCase();
                    this._filterCommands(query);
                    this.selectedIndex = 0;
                    this._render();
                }
            }
        }

        // If menu is open and user deletes back past the slash, hide
        if (this.visible && this.triggerRange) {
            const currentRange = this.editor.getSelection();
            if (currentRange && currentRange.startLineNumber === this.triggerRange.startLineNumber) {
                const lineContent = this.editor.getModel().getLineContent(currentRange.startLineNumber);
                const slashIndex = lineContent.lastIndexOf('/', currentRange.startColumn - 1);
                if (slashIndex < 0) {
                    this.hide();
                }
            }
        }
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e
     */
    _handleKeydown(e) {
        if (!this.visible) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
            this._render();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
            this._render();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.filteredCommands.length > 0) {
                this._selectCommand(this.filteredCommands[this.selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.hide();
        }
    }

    /**
     * Handle document clicks to dismiss menu
     * @param {MouseEvent} e
     */
    _handleDocumentClick(e) {
        if (!this.visible || !this.menu) return;
        if (this.menu.contains(e.target)) return;
        this.hide();
    }

    /**
     * Check if cursor is at line start or after a space
     * @returns {boolean}
     */
    _isAtLineStartOrAfterSpace() {
        const position = this.editor.getPosition();
        if (!position) return false;

        const lineContent = this.editor.getModel().getLineContent(position.lineNumber);
        const col = position.column;

        if (col === 1) return true;
        return lineContent[col - 2] === ' ';
    }

    /**
     * Filter commands by query
     * @param {string} query
     */
    _filterCommands(query) {
        this.filteredCommands = SLASH_COMMANDS.filter(cmd => {
            const searchStr = `${cmd.label} ${cmd.desc || ''} ${cmd.keywords.join(' ')}`.toLowerCase();
            return searchStr.includes(query);
        });
    }

    /**
     * Position menu near the cursor
     */
    _positionMenu() {
        const position = this.editor.getPosition();
        if (!position || !this.menu) return;

        const coords = this.editor.getScrolledVisiblePosition(position);
        if (!coords) return;

        const editorRect = this.editor.getDomNode().getBoundingClientRect();
        const top = coords.top + editorRect.top + 24;
        const left = coords.left + editorRect.left;

        this.menu.style.top = `${top}px`;
        this.menu.style.left = `${left}px`;
    }

    /**
     * Render the menu items
     */
    _render() {
        if (!this.menu) return;

        if (this.filteredCommands.length === 0) {
            this.menu.innerHTML = '<div class="slash-menu-empty">No commands found</div>';
            return;
        }

        this.menu.innerHTML = this.filteredCommands.map((cmd, index) => `
            <div class="slash-menu-item ${index === this.selectedIndex ? 'selected' : ''}"
                 data-index="${index}"
                 data-id="${escapeHtml(cmd.id)}"
                 role="option"
                 aria-selected="${index === this.selectedIndex}">
                <span class="slash-menu-icon">${escapeHtml(cmd.icon)}</span>
                <span class="slash-menu-label">${escapeHtml(cmd.label)}</span>
                ${cmd.desc ? `<span class="slash-menu-desc">${escapeHtml(cmd.desc)}</span>` : ''}
            </div>
        `).join('');

        // Add click handlers
        this.menu.querySelectorAll('.slash-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                const cmd = this.filteredCommands[index];
                if (cmd) this._selectCommand(cmd);
            });
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = parseInt(item.dataset.index, 10);
                this._render();
            });
        });
    }

    /**
     * Select and insert a command
     * @param {SlashCommand} cmd
     */
    async _selectCommand(cmd) {
        if (!this.editor || !cmd) return;

        // Remove the slash and query text using executeEdits
        if (this.triggerRange) {
            const currentRange = this.editor.getSelection();
            if (currentRange && currentRange.startLineNumber === this.triggerRange.startLineNumber) {
                const lineContent = this.editor.getModel().getLineContent(currentRange.startLineNumber);
                const slashIndex = lineContent.lastIndexOf('/', currentRange.startColumn - 1);
                if (slashIndex >= 0) {
                    const startCol = slashIndex + 1;
                    const endCol = currentRange.startColumn;
                    const range = {
                        startLineNumber: this.triggerRange.startLineNumber,
                        startColumn: startCol,
                        endLineNumber: currentRange.startLineNumber,
                        endColumn: endCol
                    };
                    this.editor.executeEdits('slash-commands', [{
                        range,
                        text: ''
                    }]);
                }
            }
        }

        // Insert the command text
        const { insertText } = await import('../toolbar/index.js');
        insertText(cmd.insert);
        this.hide();
        this.editor.focus();
    }
}

export const slashCommandsManager = new SlashCommandsManager();
export { SlashCommandsManager };
export default slashCommandsManager;
