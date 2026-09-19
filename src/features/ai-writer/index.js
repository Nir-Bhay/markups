/**
 * AI Writer Manager
 * Main controller for the AI Writing Assistant feature
 * Coordinates between AIService, UI, and the Monaco editor
 * @module features/ai-writer
 */

import { eventBus, EVENTS, Subscriptions } from '../../utils/eventBus.js';
import { editorService } from '../../core/editor/index.js';
import { storageService } from '../../core/storage/index.js';
import { STORAGE_KEYS } from '../../core/storage/keys.js';
import { toast } from '../../ui/toast/index.js';
import { aiService } from './service.js';
import { aiWriterUI } from './ui.js';
import { ACTION_PROMPTS } from './system-prompt.js';

/**
 * Which insert button to suggest after a generation finishes.
 * Selection-based actions suggest Replace; new-content actions suggest Cursor.
 * Review is read-only so nothing is suggested.
 * @param {string} action - Action name (generate, edit, improve, ...)
 * @param {Object|null} target - Captured edit target (may hold selectedText)
 * @returns {'cursor'|'replace'|null}
 */
export function getRecommendedApplyMode(action, target) {
    if (action === 'review') return null;
    if (['edit', 'improve', 'summarize', 'expand'].includes(action)) {
        return target?.selectedText?.trim() ? 'replace' : 'cursor';
    }
    return 'cursor';
}

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
        this._pendingTarget = null;
        this._lastRun = null;
        this._lastReviewText = '';

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
        this._doShow();
        if (!aiService.isConfigured()) {
            aiWriterUI.openSettings();
        }
    }

    /**
     * Hide AI panel
     */
    hide() {
        aiWriterUI.hide();
        this.visible = false;
        storageService.set(STORAGE_KEYS.AI_PANEL_VISIBLE, false);
        this._updateToolbarButton(false);
        window.dispatchEvent(new Event('resize'));
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

        await this._runAI(actionPrompt, this._captureEditTarget(), { action: 'generate', userLabel: this._label(userPrompt) });
        aiWriterUI.clearInput();
    }

    async addContent(prompt) {
        const userPrompt = prompt || aiWriterUI.getInput();
        if (!userPrompt) {
            toast.show('Describe what to add to the document', { type: 'warning', duration: 2200 });
            return;
        }
        const actionPrompt = ACTION_PROMPTS.add(userPrompt, editorService.getValue() || '');
        await this._runAI(actionPrompt, this._captureEditTarget(), { action: 'add', userLabel: this._label(userPrompt) });
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
        await this._runAI(actionPrompt, this._captureEditTarget(), { action: 'continue', userLabel: 'Continue writing' });
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
        if (!this._ensureContext(selectedText)) return;

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
        await this._runAI(actionPrompt, this._captureEditTarget({ requireSelection: true }), { action: 'edit', showDiff: true, needsSelection: true, userLabel: `Edit: ${this._label(editInstruction)}` });
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
        if (!this._ensureContext(selectedText)) return;

        const actionPrompt = ACTION_PROMPTS.summarize(selectedText);
        await this._runAI(actionPrompt, this._captureEditTarget({ requireSelection: true }), { action: 'summarize', needsSelection: true, userLabel: 'Summarize selected text' });
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
        if (!this._ensureContext(selectedText)) return;

        const actionPrompt = ACTION_PROMPTS.expand(selectedText);
        await this._runAI(actionPrompt, this._captureEditTarget({ requireSelection: true }), { action: 'expand', showDiff: true, needsSelection: true, userLabel: 'Expand selected text' });
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
        if (!this._ensureContext(selectedText)) return;

        const actionPrompt = ACTION_PROMPTS.improve(selectedText);
        await this._runAI(actionPrompt, this._captureEditTarget({ requireSelection: true }), { action: 'improve', showDiff: true, needsSelection: true, userLabel: 'Improve selected text' });
    }

    /**
     * Review the current document without applying changes.
     */
    async review() {
        const docContent = editorService.getValue() || '';
        if (!docContent.trim()) {
            toast.show('The document is empty. Add Markdown before reviewing.', { type: 'warning', duration: 2200 });
            return;
        }
        if (!this._ensureContext(docContent)) return;
        await this._runAI(ACTION_PROMPTS.review(docContent), this._captureEditTarget(), { action: 'review', readOnly: true, userLabel: 'Review document', rememberReview: true });
    }

    /**
     * Stop current generation
     */
    stopGeneration() {
        if (this.isGenerating) {
            aiService.abort();
            this.isGenerating = false;
            this._pendingTarget = null;
        }
    }

    /**
     * Open settings inside the AI sidebar
     */
    openSettings() {
        if (!this.visible) this._doShow();
        aiWriterUI.openSettings();
    }

    /**
     * Dispose manager
     */
    dispose() {
        this.stopGeneration();
        this.subscriptions?.dispose();
        if (this._boundKeydown) {
            document.removeEventListener('keydown', this._boundKeydown);
            this._boundKeydown = null;
        }
        aiWriterUI.dispose?.();
        this.initialized = false;
        this.subscriptions = null;
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
        this._refreshSelectionStrip();
        window.dispatchEvent(new Event('resize'));
        eventBus.emit(EVENTS.AI_PANEL_TOGGLED, { visible: true });
    }

    /**
     * Mirror the live editor selection into the sidebar strip.
     * Only runs while the panel is visible; safe when the editor is absent.
     * @private
     */
    _refreshSelectionStrip() {
        if (!this.visible) return;
        try {
            const docValue = editorService.getValue() || '';
            aiWriterUI.setSelection(editorService.getSelectedText(), {
                hasContent: docValue.trim().length > 0
            });
        } catch {
            // Editor not ready (tests, early boot) — strip stays hidden.
        }
    }

    /**
     * Run an AI generation with streaming
     * @param {string} actionPrompt - Full prompt to send
     * @private
     */
    async _runAI(actionPrompt, target = null, options = {}) {
        if (this.isGenerating) {
            toast.show('Already generating. Please wait or stop.', { type: 'warning', duration: 2000 });
            return;
        }

        if (!aiService.isConfigured()) {
            if (!this.visible) this._doShow();
            aiWriterUI.openSettings();
            toast.show('Add your API key in AI Settings first.', { type: 'warning', duration: 2500 });
            return;
        }

        // Dismissed selection context: selection actions abort, others go composer-only
        const selectionIgnored = aiWriterUI.consumeSelectionIgnored();
        if (selectionIgnored && options.needsSelection === true) {
            toast.show('You dismissed the selection context. Select text again to use this action.', {
                type: 'warning',
                duration: 2800
            });
            return;
        }

        this.isGenerating = true;
        this._pendingTarget = target;
        this._lastRun = { actionPrompt, target, options };
        aiWriterUI.showStatus({
            userLabel: options.userLabel || '',
            action: options.action || '',
            model: aiService.getConfig()?.model || ''
        });
        eventBus.emit(EVENTS.AI_GENERATION_STARTED);

        try {
            const _result = await aiService.streamMessage(actionPrompt, {
                onChunk: (chunk, fullText) => {
                    aiWriterUI.appendChunk(chunk, fullText);
                    eventBus.emit(EVENTS.AI_GENERATION_STREAMING, { chunk, fullText });
                },
                onUsage: (usage) => {
                    eventBus.emit(EVENTS.AI_GENERATION_USAGE, { usage });
                },
                onComplete: (fullText) => {
                    aiWriterUI.showResult(fullText, {
                        readOnly: options.readOnly === true,
                        recommended: getRecommendedApplyMode(options.action, target),
                        targetChars: target?.selectedText?.length ?? 0
                    });
                    if (options.showDiff && target?.selectedText) {
                        aiWriterUI.showDiff(target.selectedText, fullText);
                    }
                    if (options.rememberReview === true) {
                        this._lastReviewText = fullText;
                    }
                    eventBus.emit(EVENTS.AI_GENERATION_COMPLETE, { text: fullText, readOnly: options.readOnly === true });
                },
                onError: (error) => {
                    if (error.cancelled) {
                        aiWriterUI.hideStatus();
                        toast.show('Generation cancelled', { type: 'info', duration: 1500 });
                    } else {
                        aiWriterUI.showError(error.message, this._errorHelp(error));
                        eventBus.emit(EVENTS.AI_GENERATION_ERROR, { error: error.message });
                    }
                }
            });
        } catch (error) {
            if (!error.cancelled) {
                aiWriterUI.showError(error.message, this._errorHelp(error));
            }
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Map API errors to next-step help for the error card.
     * @private
     */
    _errorHelp(error) {
        const status = error?.status;
        const text = `${error?.message || ''} ${error?.code || ''}`;
        if (status === 401 || status === 403 || /invalid api key|unauthorized|incorrect api key/i.test(text)) {
            return { nextStep: 'Check your key in AI Settings.', showSettings: true };
        }
        if (status === 404 || /not found|no such model/i.test(text)) {
            return { nextStep: 'Check endpoint and model name.', showSettings: true };
        }
        if (status === 429 || /rate limit|too many requests/i.test(text)) {
            return { nextStep: 'Wait a moment, then Retry.', showSettings: false };
        }
        if (/offline|network|fetch|load failed|ECONN/i.test(text)) {
            return { nextStep: 'Reconnect, then Retry.', showSettings: false };
        }
        return { nextStep: '', showSettings: false };
    }

    /**
     * Short display label for the chat thread (prompts truncated).
     * @private
     */
    _label(text) {
        const clean = String(text || '').replace(/\s+/g, ' ').trim();
        return clean.length > 300 ? `${clean.slice(0, 300)}…` : clean;
    }

    _captureEditTarget({ requireSelection = false } = {}) {
        const editor = editorService.getEditor();
        const model = editor?.getModel();
        if (!editor || !model) return null;

        const selection = editor.getSelection();
        if (!selection) return null;
        if (requireSelection && selection.isEmpty()) return null;

        return {
            modelId: model.uri?.toString?.() || model.id || '',
            version: model.getAlternativeVersionId?.() ?? model.getVersionId?.() ?? 0,
            range: {
                startLineNumber: selection.startLineNumber,
                startColumn: selection.startColumn,
                endLineNumber: selection.endLineNumber,
                endColumn: selection.endColumn
            },
            selectedText: model.getValueInRange(selection),
            cursorPosition: {
                lineNumber: selection.positionLineNumber || selection.endLineNumber,
                column: selection.positionColumn || selection.endColumn
            }
        };
    }

    _isTargetCurrent(target) {
        if (!target) return true;
        const editor = editorService.getEditor();
        const model = editor?.getModel();
        if (!model) return false;

        const modelId = model.uri?.toString?.() || model.id || '';
        if (modelId !== target.modelId) return false;
        const currentVersion = model.getAlternativeVersionId?.() ?? model.getVersionId?.() ?? 0;
        if (currentVersion !== target.version) return false;
        return model.getValueInRange(target.range) === target.selectedText;
    }

    /**
     * Insert AI result into editor
     * @param {string} text - Text to insert
     * @param {string} mode - 'cursor' | 'replace' | 'append'
     * @private
     */
    /**
     * Retry the last run reusing its captured target (no re-capture).
     */
    async retryLast() {
        if (!this._lastRun) {
            toast.show('Nothing to retry yet', { type: 'info', duration: 1800 });
            return;
        }
        const { actionPrompt, target, options } = this._lastRun;
        await this._runAI(actionPrompt, target, { ...options, userLabel: '' });
    }

    /**
     * Fix the issues from the last document review against the full document.
     */
    async fixReviewIssues() {
        if (!this._lastReviewText) {
            toast.show('Run Review first, then fix issues', { type: 'warning', duration: 2200 });
            return;
        }
        const docContent = editorService.getValue() || '';
        if (!docContent.trim()) {
            toast.show('The document is empty.', { type: 'warning', duration: 2000 });
            return;
        }
        if (!this._ensureContext(this._lastReviewText, docContent)) return;
        const actionPrompt = 'Fix every issue listed in the review below against the full document. '
            + 'Output ONLY the corrected Markdown document, no commentary.\n\n'
            + `Review:\n${this._lastReviewText}\n\nDocument:\n${docContent}`;
        await this._runAI(actionPrompt, this._captureEditTarget(), {
            action: 'generate',
            userLabel: 'Fix review issues'
        });
    }

    /**
     * Summarize the fixes from the last document review.
     */
    async summarizeReviewFixes() {
        if (!this._lastReviewText) {
            toast.show('Run Review first, then summarize', { type: 'warning', duration: 2200 });
            return;
        }
        if (!this._ensureContext(this._lastReviewText)) return;
        const actionPrompt = 'Summarize the fixes needed according to this document review. '
            + 'Output a short Markdown checklist, no commentary.\n\n'
            + `Review:\n${this._lastReviewText}`;
        await this._runAI(actionPrompt, this._captureEditTarget(), {
            action: 'summarize',
            userLabel: 'Summarize fixes'
        });
    }

    _insertResult(text, mode, messageId = null) {
        if (!text) return;

        const editor = editorService.getEditor();
        if (!editor) return;
        if (!this._isTargetCurrent(this._pendingTarget)) {
            if (messageId != null) aiWriterUI.markStale(messageId);
            toast.show('The document changed while AI was working. Generate again before applying.', {
                type: 'warning',
                duration: 3200
            });
            return;
        }

        switch (mode) {
            case 'replace': {
                const selection = this._pendingTarget?.range || editor.getSelection();
                if (selection && !this._isEmptyRange(selection)) {
                    editor.executeEdits('ai-writer', [{
                        range: selection,
                        text: text
                    }]);
                } else {
                    this._insertAtCapturedCursor(editor, text);
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
                this._insertAtCapturedCursor(editor, text);
                break;
            }
        }

        this._pendingTarget = null;
        editorService.focus();
        if (messageId != null) aiWriterUI.markApplied(messageId, mode);
        toast.show('Content inserted', { type: 'success', duration: 1500 });
    }

    _isEmptyRange(range) {
        return range.startLineNumber === range.endLineNumber
            && range.startColumn === range.endColumn;
    }

    _insertAtCapturedCursor(editor, text) {
        const cursor = this._pendingTarget?.cursorPosition;
        if (!cursor) {
            editorService.insertText(text);
            return;
        }
        editor.executeEdits('ai-writer', [{
            range: {
                startLineNumber: cursor.lineNumber,
                startColumn: cursor.column,
                endLineNumber: cursor.lineNumber,
                endColumn: cursor.column
            },
            text
        }]);
    }

    _ensureContext(text) {
        const limit = aiService.getConfig().contextChars;
        if (String(text || '').length <= limit) return true;
        toast.show(
            `Selection is too large for the current AI limit (${limit.toLocaleString()} characters). Select a smaller section or increase the limit in AI Settings.`,
            { type: 'warning', duration: 3800 }
        );
        return false;
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        this.subscriptions = this.subscriptions || new Subscriptions();
        const sub = (event, handler) => this.subscriptions.on(event, handler);

        // Panel toggle from UI
        sub(EVENTS.AI_PANEL_TOGGLED, ({ visible }) => {
            if (!visible && this.visible) {
                this.hide();
            }
        });

        // Panel requested from elsewhere (e.g. editor right-click menu)
        sub(EVENTS.AI_PANEL_REQUESTED, ({ action } = {}) => {
            this.show();
            if (!action) {
                this._refreshSelectionStrip();
                return;
            }
            if (action === 'edit-focus') {
                aiWriterUI.focusInput();
                toast.show('Type your instruction below, then press Enter', { type: 'info', duration: 2500 });
                return;
            }
            const run = {
                generate: () => this.generate(),
                improve: () => this.improve(),
                summarize: () => this.summarize(),
                expand: () => this.expand(),
                review: () => this.review()
            }[action];
            run?.();
        });

        // Live editor selection mirrored into the sidebar strip
        sub(EVENTS.SELECTION_CHANGED, () => {
            this._refreshSelectionStrip();
        });

        // Cancel generation
        sub(EVENTS.AI_GENERATION_CANCELLED, () => {
            this.stopGeneration();
        });

        // Insert result
        sub(EVENTS.AI_RESULT_INSERTED, ({ text, mode, messageId }) => {
            const resolved = messageId != null ? aiWriterUI.getMessageText(messageId) : (text ?? aiWriterUI.lastResult);
            this._insertResult(resolved, mode, messageId);
        });

        // Action events from UI buttons / composer (composer passes prompt/instruction
        // because it clears the textarea before the handler runs)
        sub('ai:action-generate', (payload) => this.generate(payload?.prompt));
        sub('ai:action-add', (payload) => this.addContent(payload?.prompt));
        sub('ai:action-continue', () => this.continueWriting());
        sub('ai:action-edit', (payload) => this.editSelection(payload?.instruction));
        sub('ai:action-improve', () => this.improve());
        sub('ai:action-summarize', () => this.summarize());
        sub('ai:action-expand', () => this.expand());
        sub('ai:action-review', () => this.review());
        sub('ai:action-retry', () => this.retryLast());
        sub('ai:action-fix-issues', () => this.fixReviewIssues());
        sub('ai:action-summarize-fixes', () => this.summarizeReviewFixes());

        // Follow-up queue: run the queued message after each completed stream
        sub(EVENTS.AI_GENERATION_COMPLETE, () => {
            const next = aiWriterUI.takeQueuedFollowUp();
            if (next && !this.isGenerating) {
                this.generate(next);
            }
        });
    }

    /**
     * Setup Ctrl+Shift+A keyboard shortcut
     * @private
     */
    _setupKeyboardShortcut() {
        this._boundKeydown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.toggle();
                return;
            }
            if (e.key === 'Escape' && this.visible && aiWriterUI.settingsOpen) {
                e.preventDefault();
                aiWriterUI.closeSettings();
            }
        };
        document.addEventListener('keydown', this._boundKeydown);
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
            btn.setAttribute('aria-pressed', String(active));
        }
    }
}

// Export singleton
export const aiWriterManager = new AIWriterManager();

export { AIWriterManager };

export default aiWriterManager;
