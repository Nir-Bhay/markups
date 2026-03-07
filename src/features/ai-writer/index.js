/**
 * AI Writer Manager
 * Main controller for the AI Writing Assistant feature
 * Coordinates between AIService, UI, and the Monaco editor
 * @module features/ai-writer
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { editorService } from '../../core/editor/index.js';
import { storageService } from '../../core/storage/index.js';
import { STORAGE_KEYS } from '../../core/storage/keys.js';
import { toast } from '../../ui/toast/index.js';
import { aiService } from './service.js';
import { aiWriterUI } from './ui.js';
import { ACTION_PROMPTS } from './system-prompt.js';

/**
 * AIWriterManager class
 * Orchestrates AI writing features within the editor
 */
class AIWriterManager {
    static instance = null;

    constructor() {
        if (AIWriterManager.instance) {
            return AIWriterManager.instance;
        }

        this.isGenerating = false;
        this.visible = false;
        this.initialized = false;

        AIWriterManager.instance = this;
    }

    /**
     * Initialize the AI Writer feature
     */
    initialize() {
        if (this.initialized) return;

        // Initialize UI
        aiWriterUI.initialize();

        // Render panel into container
        const container = document.querySelector('#ai-writer-panel');
        if (container) {
            aiWriterUI.renderPanel(container);
        }

        // Setup event listeners
        this._setupEventListeners();

        // Setup keyboard shortcut
        this._setupKeyboardShortcut();

        // Setup toolbar button
        this._setupToolbarButton();

        // Restore panel visibility from storage
        const wasVisible = storageService.get(STORAGE_KEYS.AI_PANEL_VISIBLE);
        if (wasVisible) {
            this.show();
        }

        this.initialized = true;
    }

    /**
     * Toggle AI panel visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show AI panel
     */
    show() {
        // Check if AI is configured
        if (!aiService.isConfigured()) {
            aiWriterUI.initialize();
            aiWriterUI.openSettings(() => {
                if (aiService.isConfigured()) {
                    this._doShow();
                }
            });
            return;
        }

        this._doShow();
    }

    /**
     * Hide AI panel
     */
    hide() {
        aiWriterUI.hide();
        this.visible = false;
        storageService.set(STORAGE_KEYS.AI_PANEL_VISIBLE, false);
        this._updateToolbarButton(false);
        eventBus.emit(EVENTS.AI_PANEL_TOGGLED, { visible: false });
    }

    /**
     * Generate markdown from prompt
     * @param {string} [prompt] - User prompt (uses input field if not provided)
     */
    async generate(prompt) {
        const userPrompt = prompt || aiWriterUI.getInput();
        if (!userPrompt) {
            toast.show('Please enter a prompt', { type: 'warning', duration: 2000 });
            return;
        }

        const docContent = editorService.getValue() || '';
        const actionPrompt = ACTION_PROMPTS.generate(userPrompt, docContent);

        await this._runAI(actionPrompt);
        aiWriterUI.clearInput();
    }

    /**
     * Continue writing from cursor position
     */
    async continueWriting() {
        const docContent = editorService.getValue() || '';
        if (!docContent.trim()) {
            toast.show('Document is empty. Try Generate instead.', { type: 'warning', duration: 2000 });
            return;
        }

        const editor = editorService.getEditor();
        if (!editor) return;

        const position = editor.getPosition();
        const model = editor.getModel();
        const cursorOffset = model.getOffsetAt(position);

        const actionPrompt = ACTION_PROMPTS.continue(docContent, cursorOffset);
        await this._runAI(actionPrompt);
    }

    /**
     * Edit selected text with instruction
     * @param {string} [instruction] - Edit instruction (prompts user if not provided)
     */
    async editSelection(instruction) {
        const selectedText = editorService.getSelectedText();
        if (!selectedText) {
            toast.show('Please select text to edit', { type: 'warning', duration: 2000 });
            return;
        }

        const editInstruction = instruction || aiWriterUI.getInput();
        if (!editInstruction) {
            toast.show('Please enter an edit instruction', { type: 'warning', duration: 2000 });
            return;
        }

        const docContent = editorService.getValue() || '';
        const editor = editorService.getEditor();
        const selection = editor.getSelection();
        const model = editor.getModel();

        // Get surrounding context
        const startOffset = model.getOffsetAt({ lineNumber: selection.startLineNumber, column: selection.startColumn });
        const endOffset = model.getOffsetAt({ lineNumber: selection.endLineNumber, column: selection.endColumn });
        const before = docContent.substring(Math.max(0, startOffset - 500), startOffset);
        const after = docContent.substring(endOffset, endOffset + 500);
        const surroundingContext = `...${before}\n[SELECTED TEXT]\n${after}...`;

        const actionPrompt = ACTION_PROMPTS.edit(selectedText, editInstruction, surroundingContext);
        await this._runAI(actionPrompt);
        aiWriterUI.clearInput();
    }

    /**
     * Summarize selected text
     */
    async summarize() {
        const selectedText = editorService.getSelectedText();
        if (!selectedText) {
            toast.show('Please select text to summarize', { type: 'warning', duration: 2000 });
            return;
        }

        const actionPrompt = ACTION_PROMPTS.summarize(selectedText);
        await this._runAI(actionPrompt);
    }

    /**
     * Expand selected text
     */
    async expand() {
        const selectedText = editorService.getSelectedText();
        if (!selectedText) {
            toast.show('Please select text to expand', { type: 'warning', duration: 2000 });
            return;
        }

        const actionPrompt = ACTION_PROMPTS.expand(selectedText);
        await this._runAI(actionPrompt);
    }

    /**
     * Improve selected text
     */
    async improve() {
        const selectedText = editorService.getSelectedText();
        if (!selectedText) {
            toast.show('Please select text to improve', { type: 'warning', duration: 2000 });
            return;
        }

        const actionPrompt = ACTION_PROMPTS.improve(selectedText);
        await this._runAI(actionPrompt);
    }

    /**
     * Stop current generation
     */
    stopGeneration() {
        if (this.isGenerating) {
            aiService.abort();
            this.isGenerating = false;
        }
    }

    /**
     * Open settings modal
     */
    openSettings() {
        aiWriterUI.openSettings();
    }

    /**
     * Dispose manager
     */
    dispose() {
        this.stopGeneration();
        this.initialized = false;
        AIWriterManager.instance = null;
    }

    // ==================== Private ====================

    /**
     * Actually show the panel
     * @private
     */
    _doShow() {
        aiWriterUI.show();
        this.visible = true;
        storageService.set(STORAGE_KEYS.AI_PANEL_VISIBLE, true);
        this._updateToolbarButton(true);
        eventBus.emit(EVENTS.AI_PANEL_TOGGLED, { visible: true });
    }

    /**
     * Run an AI generation with streaming
     * @param {string} actionPrompt - Full prompt to send
     * @private
     */
    async _runAI(actionPrompt) {
        if (this.isGenerating) {
            toast.show('Already generating. Please wait or stop.', { type: 'warning', duration: 2000 });
            return;
        }

        if (!aiService.isConfigured()) {
            aiWriterUI.openSettings();
            return;
        }

        this.isGenerating = true;
        aiWriterUI.showStatus('Generating...');
        eventBus.emit(EVENTS.AI_GENERATION_STARTED);

        try {
            const result = await aiService.streamMessage(actionPrompt, {
                onChunk: (chunk, fullText) => {
                    aiWriterUI.appendChunk(chunk, fullText);
                    eventBus.emit(EVENTS.AI_GENERATION_STREAMING, { chunk, fullText });
                },
                onComplete: (fullText) => {
                    aiWriterUI.showResult(fullText);
                    eventBus.emit(EVENTS.AI_GENERATION_COMPLETE, { text: fullText });
                },
                onError: (error) => {
                    if (error.cancelled) {
                        aiWriterUI.hideStatus();
                        toast.show('Generation cancelled', { type: 'info', duration: 1500 });
                    } else {
                        aiWriterUI.showError(error.message);
                        eventBus.emit(EVENTS.AI_GENERATION_ERROR, { error: error.message });
                    }
                }
            });
        } catch (error) {
            if (!error.cancelled) {
                aiWriterUI.showError(error.message);
            }
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Insert AI result into editor
     * @param {string} text - Text to insert
     * @param {string} mode - 'cursor' | 'replace' | 'append'
     * @private
     */
    _insertResult(text, mode) {
        if (!text) return;

        const editor = editorService.getEditor();
        if (!editor) return;

        switch (mode) {
            case 'replace': {
                const selection = editor.getSelection();
                if (selection && !selection.isEmpty()) {
                    editor.executeEdits('ai-writer', [{
                        range: selection,
                        text: text
                    }]);
                } else {
                    // No selection, insert at cursor
                    editorService.insertText(text);
                }
                break;
            }
            case 'append': {
                const model = editor.getModel();
                const lastLine = model.getLineCount();
                const lastColumn = model.getLineMaxColumn(lastLine);
                editor.executeEdits('ai-writer', [{
                    range: {
                        startLineNumber: lastLine,
                        startColumn: lastColumn,
                        endLineNumber: lastLine,
                        endColumn: lastColumn
                    },
                    text: '\n\n' + text
                }]);
                break;
            }
            case 'cursor':
            default: {
                editorService.insertText(text);
                break;
            }
        }

        editorService.focus();
        toast.show('Content inserted', { type: 'success', duration: 1500 });
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Panel toggle from UI
        eventBus.on(EVENTS.AI_PANEL_TOGGLED, ({ visible }) => {
            if (!visible && this.visible) {
                this.hide();
            }
        });

        // Cancel generation
        eventBus.on(EVENTS.AI_GENERATION_CANCELLED, () => {
            this.stopGeneration();
        });

        // Insert result
        eventBus.on(EVENTS.AI_RESULT_INSERTED, ({ text, mode }) => {
            this._insertResult(text, mode);
        });

        // Action events from UI buttons
        eventBus.on('ai:action-generate', () => this.generate());
        eventBus.on('ai:action-continue', () => this.continueWriting());
        eventBus.on('ai:action-edit', () => this.editSelection());
        eventBus.on('ai:action-improve', () => this.improve());
        eventBus.on('ai:action-summarize', () => this.summarize());
        eventBus.on('ai:action-expand', () => this.expand());
    }

    /**
     * Setup Ctrl+Shift+A keyboard shortcut
     * @private
     */
    _setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Setup toolbar button click handler
     * @private
     */
    _setupToolbarButton() {
        const btn = document.querySelector('#ai-writer-button');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    }

    /**
     * Update toolbar button active state
     * @param {boolean} active
     * @private
     */
    _updateToolbarButton(active) {
        const btn = document.querySelector('#ai-writer-button');
        if (btn) {
            btn.classList.toggle('ai-active', active);
        }
    }
}

// Export singleton
export const aiWriterManager = new AIWriterManager();

export { AIWriterManager };

export default aiWriterManager;
