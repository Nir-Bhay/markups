/**
 * AI Writer UI Components
 * Renders AI panel, settings modal, and floating action menu
 * CSS injected via JS (same pattern as ui/modal)
 * @module features/ai-writer/ui
 */

import { modal } from '../../ui/modal/index.js';
import { toast } from '../../ui/toast/index.js';
import { aiService, PROVIDERS } from './service.js';
import { eventBus, EVENTS } from '../../utils/eventBus.js';

/**
 * AIWriterUI class
 * Manages all AI Writer visual components
 */
class AIWriterUI {
    constructor() {
        this.panelEl = null;
        this.outputEl = null;
        this.inputEl = null;
        this.actionsEl = null;
        this.insertBarEl = null;
        this.statusEl = null;
        this.visible = false;
        this.lastResult = '';
        this.initialized = false;
    }

    /**
     * Initialize UI components
     */
    initialize() {
        if (this.initialized) return;
        this._injectStyles();
        this.initialized = true;
    }

    /**
     * Render the AI panel into the given container
     * @param {HTMLElement} container - Panel container element
     */
    renderPanel(container) {
        if (!container) return;
        this.panelEl = container;

        container.innerHTML = `
            <div class="ai-panel-inner">
                <div class="ai-panel-header">
                    <div class="ai-panel-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        MarkupsAI
                    </div>
                    <div class="ai-panel-header-actions">
                        <button class="ai-panel-btn-icon" id="ai-settings-btn" title="AI Settings" aria-label="AI Settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                        <button class="ai-panel-btn-icon" id="ai-close-btn" title="Close AI Panel" aria-label="Close">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="ai-panel-actions" id="ai-actions">
                    <button class="ai-action-btn" data-action="generate" title="Generate from prompt">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        Generate
                    </button>
                    <button class="ai-action-btn" data-action="continue" title="Continue from cursor">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                        Continue
                    </button>
                    <button class="ai-action-btn" data-action="edit" title="Edit selection with instruction">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="ai-action-btn" data-action="improve" title="Improve writing quality">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Improve
                    </button>
                    <button class="ai-action-btn" data-action="summarize" title="Summarize selection">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
                        Summarize
                    </button>
                    <button class="ai-action-btn" data-action="expand" title="Expand content">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        Expand
                    </button>
                </div>

                <div class="ai-panel-input-area">
                    <textarea class="ai-panel-input" id="ai-input"
                        placeholder="Ask MarkupsAI to write, edit, or improve your document..."
                        rows="3"></textarea>
                    <button class="ai-panel-send" id="ai-send-btn" title="Send (Enter)" aria-label="Send">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>

                <div class="ai-panel-status" id="ai-status" style="display:none;">
                    <div class="ai-status-indicator">
                        <div class="ai-spinner"></div>
                        <span id="ai-status-text">Generating...</span>
                    </div>
                    <button class="ai-stop-btn" id="ai-stop-btn" title="Stop generation">Stop</button>
                </div>

                <div class="ai-panel-output" id="ai-output" style="display:none;">
                    <div class="ai-output-header">
                        <span class="ai-output-label">AI Output</span>
                        <button class="ai-panel-btn-icon ai-copy-btn" id="ai-copy-btn" title="Copy to clipboard">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="ai-output-content" id="ai-output-content"></div>
                    <div class="ai-insert-bar" id="ai-insert-bar">
                        <button class="ai-insert-btn ai-insert-primary" data-insert="cursor" title="Insert at cursor position">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Insert at Cursor
                        </button>
                        <button class="ai-insert-btn" data-insert="replace" title="Replace selected text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Replace Selection
                        </button>
                        <button class="ai-insert-btn" data-insert="append" title="Append to end of document">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                            Append
                        </button>
                    </div>
                </div>

                <div class="ai-panel-placeholder" id="ai-placeholder">
                    <div class="ai-placeholder-content">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <p>Select an action above or type a prompt</p>
                        <small>AI works only in the writing section</small>
                    </div>
                </div>
            </div>
        `;

        // Cache element references
        this.outputEl = container.querySelector('#ai-output');
        this.inputEl = container.querySelector('#ai-input');
        this.actionsEl = container.querySelector('#ai-actions');
        this.insertBarEl = container.querySelector('#ai-insert-bar');
        this.statusEl = container.querySelector('#ai-status');

        this._attachPanelEvents();
    }

    /**
     * Show the AI panel
     */
    show() {
        if (this.panelEl) {
            this.panelEl.style.display = '';
            this.visible = true;
            if (this.inputEl) this.inputEl.focus();
        }
    }

    /**
     * Hide the AI panel
     */
    hide() {
        if (this.panelEl) {
            this.panelEl.style.display = 'none';
            this.visible = false;
        }
    }

    /**
     * Show generating status
     * @param {string} [text] - Status text
     */
    showStatus(text = 'Generating...') {
        if (this.statusEl) {
            this.statusEl.style.display = '';
            const textEl = this.statusEl.querySelector('#ai-status-text');
            if (textEl) textEl.textContent = text;
        }
        // Hide placeholder, show output area
        const placeholder = this.panelEl?.querySelector('#ai-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        if (this.outputEl) {
            this.outputEl.style.display = '';
            const content = this.outputEl.querySelector('#ai-output-content');
            if (content) content.textContent = '';
        }
        // Hide insert bar while generating
        if (this.insertBarEl) this.insertBarEl.style.display = 'none';
        // Disable input
        if (this.inputEl) this.inputEl.disabled = true;
    }

    /**
     * Hide generating status
     */
    hideStatus() {
        if (this.statusEl) this.statusEl.style.display = 'none';
        if (this.inputEl) this.inputEl.disabled = false;
    }

    /**
     * Append streaming chunk to output
     * @param {string} chunk - Text chunk
     * @param {string} fullText - Full text so far
     */
    appendChunk(chunk, fullText) {
        const content = this.panelEl?.querySelector('#ai-output-content');
        if (content) {
            content.textContent = fullText;
            content.scrollTop = content.scrollHeight;
        }
    }

    /**
     * Show final result with insert buttons
     * @param {string} text - Complete result text
     */
    showResult(text) {
        this.lastResult = text;
        this.hideStatus();

        const content = this.panelEl?.querySelector('#ai-output-content');
        if (content) content.textContent = text;
        if (this.outputEl) this.outputEl.style.display = '';
        if (this.insertBarEl) this.insertBarEl.style.display = '';
    }

    /**
     * Show error in output
     * @param {string} message - Error message
     */
    showError(message) {
        this.hideStatus();
        const content = this.panelEl?.querySelector('#ai-output-content');
        if (content) {
            content.innerHTML = `<div class="ai-error">${this._escapeHtml(message)}</div>`;
        }
        if (this.outputEl) this.outputEl.style.display = '';
        if (this.insertBarEl) this.insertBarEl.style.display = 'none';
    }

    /**
     * Clear the output area
     */
    clearOutput() {
        const content = this.panelEl?.querySelector('#ai-output-content');
        if (content) content.textContent = '';
        if (this.outputEl) this.outputEl.style.display = 'none';
        if (this.insertBarEl) this.insertBarEl.style.display = 'none';
        this.lastResult = '';
        const placeholder = this.panelEl?.querySelector('#ai-placeholder');
        if (placeholder) placeholder.style.display = '';
    }

    /**
     * Get current input value
     * @returns {string}
     */
    getInput() {
        return this.inputEl?.value?.trim() || '';
    }

    /**
     * Clear input
     */
    clearInput() {
        if (this.inputEl) this.inputEl.value = '';
    }

    /**
     * Open AI settings modal
     * @param {Function} [onSave] - Callback after saving settings
     */
    openSettings(onSave) {
        const config = aiService.getConfig();

        const content = document.createElement('div');
        content.innerHTML = `
            <div class="ai-settings-form">
                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-provider">Provider</label>
                    <select id="ai-set-provider" class="ai-settings-select">
                        ${Object.entries(PROVIDERS).map(([key, p]) =>
                            `<option value="${key}" ${config.provider === key ? 'selected' : ''}>${p.name}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-key">API Key</label>
                    <input type="password" id="ai-set-key" class="ai-settings-input"
                        placeholder="sk-... or your API key"
                        value="${config.apiKey || ''}">
                    <small class="ai-settings-hint">Stored locally in your browser. Never sent to our servers.</small>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-endpoint">API Endpoint</label>
                    <input type="url" id="ai-set-endpoint" class="ai-settings-input"
                        placeholder="https://api.openai.com/v1"
                        value="${config.endpoint || ''}">
                    <small class="ai-settings-hint">For custom/self-hosted endpoints. Auto-filled from provider.</small>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-model">Model</label>
                    <input type="text" id="ai-set-model" class="ai-settings-input"
                        placeholder="gpt-4o-mini"
                        value="${config.model || ''}"
                        list="ai-model-list">
                    <datalist id="ai-model-list">
                        ${(PROVIDERS[config.provider]?.models || []).map(m =>
                            `<option value="${m}">`
                        ).join('')}
                    </datalist>
                </div>

                <div class="ai-settings-row">
                    <div class="ai-settings-group ai-settings-half">
                        <label class="ai-settings-label" for="ai-set-temp">Temperature</label>
                        <div class="ai-settings-range-row">
                            <input type="range" id="ai-set-temp" class="ai-settings-range"
                                min="0" max="1" step="0.1" value="${config.temperature}">
                            <span id="ai-temp-value">${config.temperature}</span>
                        </div>
                    </div>
                    <div class="ai-settings-group ai-settings-half">
                        <label class="ai-settings-label" for="ai-set-tokens">Max Tokens</label>
                        <input type="number" id="ai-set-tokens" class="ai-settings-input"
                            min="100" max="32000" step="100"
                            value="${config.maxTokens}">
                    </div>
                </div>

                <div class="ai-settings-group">
                    <button class="ai-test-btn" id="ai-test-connection">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Test Connection
                    </button>
                    <span id="ai-test-result" class="ai-test-result"></span>
                </div>
            </div>
        `;

        // Attach interactive events before opening modal
        const providerSelect = content.querySelector('#ai-set-provider');
        const endpointInput = content.querySelector('#ai-set-endpoint');
        const modelInput = content.querySelector('#ai-set-model');
        const modelList = content.querySelector('#ai-model-list');
        const tempRange = content.querySelector('#ai-set-temp');
        const tempValue = content.querySelector('#ai-temp-value');
        const testBtn = content.querySelector('#ai-test-connection');
        const testResult = content.querySelector('#ai-test-result');

        providerSelect.addEventListener('change', () => {
            const p = PROVIDERS[providerSelect.value];
            if (p) {
                endpointInput.value = p.baseUrl;
                modelInput.value = p.defaultModel;
                modelList.innerHTML = p.models.map(m => `<option value="${m}">`).join('');
            }
        });

        tempRange.addEventListener('input', () => {
            tempValue.textContent = tempRange.value;
        });

        testBtn.addEventListener('click', async () => {
            testResult.textContent = 'Testing...';
            testResult.className = 'ai-test-result';

            // Temporarily apply settings for test
            const tempConfig = {
                provider: providerSelect.value,
                apiKey: content.querySelector('#ai-set-key').value,
                endpoint: endpointInput.value,
                model: modelInput.value,
                maxTokens: 50,
                temperature: parseFloat(tempRange.value)
            };
            aiService.setConfig(tempConfig);

            const result = await aiService.testConnection();
            testResult.textContent = result.message;
            testResult.className = `ai-test-result ${result.success ? 'ai-test-success' : 'ai-test-fail'}`;
        });

        modal.open({
            title: 'AI Writer Settings',
            content,
            size: 'md',
            buttons: [
                {
                    text: 'Cancel',
                    type: 'secondary'
                },
                {
                    text: 'Save Settings',
                    type: 'primary',
                    onClick: () => {
                        aiService.setConfig({
                            provider: providerSelect.value,
                            apiKey: content.querySelector('#ai-set-key').value,
                            endpoint: endpointInput.value,
                            model: modelInput.value,
                            temperature: parseFloat(tempRange.value),
                            maxTokens: parseInt(content.querySelector('#ai-set-tokens').value, 10) || 2048
                        });

                        toast.show('AI settings saved', { type: 'success', duration: 2000 });
                        eventBus.emit(EVENTS.AI_SETTINGS_CHANGED);
                        if (onSave) onSave();
                    }
                }
            ]
        });
    }

    // ==================== Private ====================

    /**
     * Attach panel event handlers
     * @private
     */
    _attachPanelEvents() {
        if (!this.panelEl) return;

        // Settings button
        this.panelEl.querySelector('#ai-settings-btn')?.addEventListener('click', () => {
            this.openSettings();
        });

        // Close button
        this.panelEl.querySelector('#ai-close-btn')?.addEventListener('click', () => {
            eventBus.emit(EVENTS.AI_PANEL_TOGGLED, { visible: false });
        });

        // Stop button
        this.panelEl.querySelector('#ai-stop-btn')?.addEventListener('click', () => {
            eventBus.emit(EVENTS.AI_GENERATION_CANCELLED);
        });

        // Copy button
        this.panelEl.querySelector('#ai-copy-btn')?.addEventListener('click', () => {
            if (this.lastResult) {
                navigator.clipboard.writeText(this.lastResult).then(() => {
                    toast.show('Copied to clipboard', { type: 'success', duration: 1500 });
                }).catch(() => {
                    toast.show('Failed to copy', { type: 'error', duration: 1500 });
                });
            }
        });

        // Action buttons
        this.actionsEl?.querySelectorAll('.ai-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                eventBus.emit(`ai:action-${action}`);
            });
        });

        // Insert buttons
        this.insertBarEl?.querySelectorAll('.ai-insert-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.insert;
                eventBus.emit(EVENTS.AI_RESULT_INSERTED, { text: this.lastResult, mode });
            });
        });

        // Send button
        this.panelEl.querySelector('#ai-send-btn')?.addEventListener('click', () => {
            const text = this.getInput();
            if (text) {
                eventBus.emit('ai:action-generate');
            }
        });

        // Enter to send (Shift+Enter for newline)
        this.inputEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = this.getInput();
                if (text) {
                    eventBus.emit('ai:action-generate');
                }
            }
        });
    }

    /**
     * Escape HTML for safe rendering
     * @private
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Inject all AI Writer styles
     * @private
     */
    _injectStyles() {
        const styleId = 'ai-writer-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            /* ==================== AI Writer Panel ==================== */
            .ai-writer-panel {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                width: 360px;
                max-width: 100%;
                background: var(--ai-bg, #ffffff);
                border-left: 1px solid var(--ai-border, #e5e7eb);
                display: flex;
                flex-direction: column;
                z-index: 50;
                box-shadow: -4px 0 20px rgba(0, 0, 0, 0.08);
                animation: aiSlideIn 0.2s ease-out;
            }

            @keyframes aiSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .ai-panel-inner {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            /* Header */
            .ai-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 14px;
                border-bottom: 1px solid var(--ai-border, #e5e7eb);
                flex-shrink: 0;
            }

            .ai-panel-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 600;
                color: var(--ai-title-color, #111827);
            }

            .ai-panel-title svg {
                color: var(--ai-accent, #8b5cf6);
            }

            .ai-panel-header-actions {
                display: flex;
                gap: 4px;
            }

            .ai-panel-btn-icon {
                background: none;
                border: none;
                cursor: pointer;
                padding: 6px;
                border-radius: 6px;
                color: var(--ai-muted, #6b7280);
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-panel-btn-icon:hover {
                background: var(--ai-hover-bg, #f3f4f6);
                color: var(--ai-title-color, #111827);
            }

            /* Action Buttons */
            .ai-panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 10px 14px;
                border-bottom: 1px solid var(--ai-border, #e5e7eb);
                flex-shrink: 0;
            }

            .ai-action-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 5px 10px;
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 6px;
                background: var(--ai-btn-bg, #f9fafb);
                color: var(--ai-text, #374151);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
                white-space: nowrap;
            }

            .ai-action-btn:hover {
                background: var(--ai-accent, #8b5cf6);
                color: white;
                border-color: var(--ai-accent, #8b5cf6);
            }

            .ai-action-btn svg {
                flex-shrink: 0;
            }

            /* Input Area */
            .ai-panel-input-area {
                display: flex;
                gap: 8px;
                padding: 10px 14px;
                border-bottom: 1px solid var(--ai-border, #e5e7eb);
                flex-shrink: 0;
            }

            .ai-panel-input {
                flex: 1;
                resize: none;
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 13px;
                font-family: inherit;
                line-height: 1.5;
                color: var(--ai-text, #374151);
                background: var(--ai-input-bg, #ffffff);
                outline: none;
                transition: border-color 0.15s;
            }

            .ai-panel-input:focus {
                border-color: var(--ai-accent, #8b5cf6);
                box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
            }

            .ai-panel-input:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .ai-panel-send {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                align-self: flex-end;
                border: none;
                border-radius: 8px;
                background: var(--ai-accent, #8b5cf6);
                color: white;
                cursor: pointer;
                transition: all 0.15s;
                flex-shrink: 0;
            }

            .ai-panel-send:hover {
                background: var(--ai-accent-hover, #7c3aed);
            }

            /* Status */
            .ai-panel-status {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 14px;
                background: var(--ai-status-bg, #f5f3ff);
                flex-shrink: 0;
            }

            .ai-status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: var(--ai-accent, #8b5cf6);
                font-weight: 500;
            }

            .ai-spinner {
                width: 14px;
                height: 14px;
                border: 2px solid var(--ai-accent, #8b5cf6);
                border-top-color: transparent;
                border-radius: 50%;
                animation: aiSpin 0.8s linear infinite;
            }

            @keyframes aiSpin {
                to { transform: rotate(360deg); }
            }

            .ai-stop-btn {
                padding: 4px 12px;
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 6px;
                background: var(--ai-bg, #ffffff);
                color: var(--ai-text, #374151);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .ai-stop-btn:hover {
                background: #fee2e2;
                border-color: #fca5a5;
                color: #dc2626;
            }

            /* Output Area */
            .ai-panel-output {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                min-height: 0;
            }

            .ai-output-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 14px;
                flex-shrink: 0;
            }

            .ai-output-label {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--ai-muted, #6b7280);
            }

            .ai-output-content {
                flex: 1;
                overflow-y: auto;
                padding: 0 14px 14px;
                font-size: 13px;
                line-height: 1.6;
                color: var(--ai-text, #374151);
                white-space: pre-wrap;
                word-break: break-word;
                font-family: 'JetBrains Mono', monospace;
            }

            .ai-error {
                color: #dc2626;
                background: #fef2f2;
                padding: 10px 14px;
                border-radius: 6px;
                border: 1px solid #fecaca;
                font-size: 13px;
            }

            /* Insert Bar */
            .ai-insert-bar {
                display: flex;
                gap: 6px;
                padding: 10px 14px;
                border-top: 1px solid var(--ai-border, #e5e7eb);
                flex-shrink: 0;
                flex-wrap: wrap;
            }

            .ai-insert-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 6px;
                background: var(--ai-btn-bg, #f9fafb);
                color: var(--ai-text, #374151);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }

            .ai-insert-btn:hover {
                border-color: var(--ai-accent, #8b5cf6);
                color: var(--ai-accent, #8b5cf6);
            }

            .ai-insert-primary {
                background: var(--ai-accent, #8b5cf6);
                color: white;
                border-color: var(--ai-accent, #8b5cf6);
            }

            .ai-insert-primary:hover {
                background: var(--ai-accent-hover, #7c3aed);
                border-color: var(--ai-accent-hover, #7c3aed);
                color: white;
            }

            /* Placeholder */
            .ai-panel-placeholder {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-placeholder-content {
                text-align: center;
                color: var(--ai-muted, #6b7280);
            }

            .ai-placeholder-content p {
                font-size: 13px;
                margin: 10px 0 4px;
            }

            .ai-placeholder-content small {
                font-size: 11px;
                opacity: 0.7;
            }

            /* ==================== Settings Modal ==================== */
            .ai-settings-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .ai-settings-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .ai-settings-row {
                display: flex;
                gap: 16px;
            }

            .ai-settings-half {
                flex: 1;
            }

            .ai-settings-label {
                font-size: 13px;
                font-weight: 600;
                color: var(--ai-title-color, #111827);
            }

            .ai-settings-input,
            .ai-settings-select {
                padding: 8px 12px;
                border: 1px solid var(--ai-border, #d1d5db);
                border-radius: 6px;
                font-size: 14px;
                color: var(--ai-text, #374151);
                background: var(--ai-input-bg, #ffffff);
                outline: none;
                transition: border-color 0.15s;
                width: 100%;
                box-sizing: border-box;
            }

            .ai-settings-input:focus,
            .ai-settings-select:focus {
                border-color: var(--ai-accent, #8b5cf6);
                box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
            }

            .ai-settings-hint {
                font-size: 11px;
                color: var(--ai-muted, #6b7280);
            }

            .ai-settings-range-row {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .ai-settings-range {
                flex: 1;
                accent-color: var(--ai-accent, #8b5cf6);
            }

            .ai-test-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                border: 1px solid var(--ai-accent, #8b5cf6);
                border-radius: 6px;
                background: transparent;
                color: var(--ai-accent, #8b5cf6);
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }

            .ai-test-btn:hover {
                background: var(--ai-accent, #8b5cf6);
                color: white;
            }

            .ai-test-result {
                font-size: 12px;
                margin-top: 4px;
            }

            .ai-test-success { color: #059669; }
            .ai-test-fail { color: #dc2626; }

            /* ==================== AI Toolbar Button Active State ==================== */
            .toolbar-btn.ai-active {
                background: var(--ai-accent, #8b5cf6);
                color: white;
            }

            /* ==================== Dark Mode ==================== */
            [data-theme="dark"] .ai-writer-panel,
            .dark .ai-writer-panel,
            @media (prefers-color-scheme: dark) {
                .ai-writer-panel {
                    --ai-bg: #1f2937;
                    --ai-border: #374151;
                    --ai-title-color: #f3f4f6;
                    --ai-text: #d1d5db;
                    --ai-muted: #9ca3af;
                    --ai-input-bg: #111827;
                    --ai-hover-bg: #374151;
                    --ai-btn-bg: #374151;
                    --ai-accent: #a78bfa;
                    --ai-accent-hover: #8b5cf6;
                    --ai-status-bg: #1e1b4b;
                }

                .ai-error {
                    background: #450a0a;
                    border-color: #7f1d1d;
                    color: #fca5a5;
                }
            }

            [data-theme="dark"] .ai-settings-input,
            [data-theme="dark"] .ai-settings-select,
            .dark .ai-settings-input,
            .dark .ai-settings-select {
                background: #111827;
                border-color: #374151;
                color: #f3f4f6;
            }

            /* ==================== Mobile ==================== */
            @media (max-width: 768px) {
                .ai-writer-panel {
                    width: 100%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 100;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

export const aiWriterUI = new AIWriterUI();

export { AIWriterUI };

export default aiWriterUI;
