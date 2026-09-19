/**
 * AI Writer UI Components
 * Renders AI panel, in-sidebar settings sheet, and floating action menu
 * CSS injected via JS (same pattern as ui/modal)
 * @module features/ai-writer/ui
 */

import { toast } from '../../ui/toast/index.js';
import {
    aiService,
    AI_LIMITS,
    PROVIDERS,
    estimateTokens,
    isAllowedEndpoint,
    isCustomEndpoint
} from './service.js';
import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { escapeHtml } from '../../utils/escape-html.js';
import { renderLineDiffHtml } from './diff.js';

/**
 * AIWriterUI class
 * Manages all AI Writer visual components
 */
class AIWriterUI {
    constructor() {
        this.panelEl = null;
        this.threadEl = null;
        this.inputEl = null;
        this.sendBtn = null;
        this.chipsEl = null;
        this.contextCardEl = null;
        this.menuEl = null;
        this.meterEl = null;
        this.statusLineEl = null;
        this.settingsEl = null;
        this.visible = false;
        this.settingsOpen = false;
        this.initialized = false;
        this._onSettingsSave = null;
        // Chat thread state (spec §10)
        this.messages = [];
        this._messageSeq = 0;
        this._liveMessageId = null;
        this._pendingStreamText = '';
        this._streamRenderHandle = null;
        this._queuedFollowUp = null;
        this._dismissedSelection = null;
        this._composerAction = null;
        this._menuOpen = false;
    }

    /**
     * Most recent assistant message text (single source of truth = messages store).
     * @returns {string}
     */
    get lastResult() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].kind === 'assistant') return this.messages[i].text;
        }
        return '';
    }

    /**
     * Initialize UI components
     */
    initialize() {
        if (this.initialized) return;
        this._injectStyles();
        this._injectChatStyles();
        this.initialized = true;
    }

    /**
     * Render the AI panel into the given container
     * @param {HTMLElement} container - Panel container element
     */
    renderPanel(container) {
        if (!container) return;
        this.panelEl = container;
        container.setAttribute('role', 'complementary');
        container.setAttribute('aria-modal', 'false');
        container.setAttribute('aria-label', 'AI Writing Assistant');

        container.innerHTML = `
            <div class="ai-panel-inner">
                <div class="ai-panel-header">
                    <div class="ai-panel-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>MarkupsAI</span>
                        <span class="ai-header-model" id="ai-header-model"></span>
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

                <div class="ai-newchat-row">
                    <button class="ai-newchat-pill" id="ai-newchat-btn" type="button" title="Start a new chat thread">+ New</button>
                </div>

                <div class="ai-context-card" id="ai-context-card" hidden>
                    <div class="ai-context-card-text">
                        <span class="ai-context-card-label" id="ai-selection-count"></span>
                        <span class="ai-context-card-snippet" id="ai-selection-snippet"></span>
                    </div>
                    <span class="ai-context-card-hint">replies will target this</span>
                    <button class="ai-panel-btn-icon ai-context-dismiss" id="ai-context-dismiss" type="button" title="Dismiss selection context" aria-label="Dismiss selection context">×</button>
                </div>

                <div class="ai-thread" id="ai-thread" role="log" aria-label="AI conversation" aria-live="off"></div>

                <div class="ai-chips-row" id="ai-chips" role="list" aria-label="Suggested actions"></div>




                <div class="ai-composer">
                    <div class="ai-composer-row">
                        <button class="ai-actions-menu-btn" id="ai-menu-btn" type="button" title="All AI actions" aria-label="All AI actions" aria-haspopup="menu" aria-expanded="false">✦</button>
                        <textarea class="ai-panel-input" id="ai-input"
                            placeholder="Ask MarkupsAI to write, edit, or improve…"
                            rows="1" aria-label="Message MarkupsAI" aria-describedby="ai-meter"></textarea>
                        <button class="ai-panel-send" id="ai-send-btn" type="button" title="Send (Enter)" aria-label="Send message">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                    <div class="ai-meter" id="ai-meter" aria-live="off"></div>
                    <div class="ai-actions-menu" id="ai-actions-menu" role="menu" aria-label="All AI actions" hidden></div>
                </div>



                <div class="ai-settings-sheet" id="ai-settings-sheet" hidden role="region" aria-label="AI Settings">
                    <div class="ai-settings-sheet-header">
                        <button class="ai-panel-btn-icon" id="ai-settings-back" title="Back" aria-label="Close settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <span class="ai-settings-sheet-title">AI Settings</span>
                    </div>
                    <div class="ai-settings-sheet-body" id="ai-settings-body"></div>
                    <div class="ai-settings-sheet-footer">
                        <button class="ai-settings-cancel" id="ai-settings-cancel" type="button">Cancel</button>
                        <button class="ai-settings-save" id="ai-settings-save" type="button">Save</button>
                    </div>
                </div>
            </div>
        `;

        // Cache element references
        this.threadEl = container.querySelector('#ai-thread');
        this.inputEl = container.querySelector('#ai-input');
        this.sendBtn = container.querySelector('#ai-send-btn');
        this.chipsEl = container.querySelector('#ai-chips');
        this.contextCardEl = container.querySelector('#ai-context-card');
        this.menuEl = container.querySelector('#ai-actions-menu');
        this.meterEl = container.querySelector('#ai-meter');
        this.settingsEl = container.querySelector('#ai-settings-sheet');

        this._updateHeaderModel();
        this._renderEmpty();
        this.renderChips();
        this._attachPanelEvents();
    }

    /**
     * Show the AI panel
     */
    show() {
        if (this.panelEl) {
            this.panelEl.style.display = '';
            this.visible = true;
            this._updateHeaderModel();
            if (this.inputEl && !this.settingsOpen) this.inputEl.focus();
        }
    }

    /**
     * Hide the AI panel
     */
    hide() {
        if (this.panelEl) {
            this.closeSettings();
            this.panelEl.style.display = 'none';
            this.visible = false;
        }
    }

    /**
     * Show generating status
     * @param {string} [text] - Status text
     */
    /**
     * Start a generation: append user message (unless skipped) + live assistant message.
     * Facade kept for manager/tests. Accepts legacy string (status text) or options.
     * @param {string|Object} [arg] - Status text or { userLabel, action, model, statusText }
     * @returns {number|null} Live message id
     */
    showStatus(arg = {}) {
        const opts = typeof arg === 'string' ? { statusText: arg } : arg;
        const { userLabel = '', action = '', model = '', statusText = 'Generating…' } = opts;
        this._cancelStreamRender();
        if (userLabel) this._appendMessage('user', String(userLabel));
        const live = this._appendMessage('assistant', '', { action, model, streaming: true });
        this._liveMessageId = live.id;
        this._renderMessageNode(live);
        this.setComposerMode('stop');
        this._stickOrPill(true);
        this._announce(statusText);
        return live.id;
    }

    /**
     * Hide generating status. Converts an un-finalized live message to a cancelled pill.
     */
    hideStatus() {
        this._cancelStreamRender();
        const live = this._getMessage(this._liveMessageId);
        if (live && live.streaming) {
            live.streaming = false;
            this._liveMessageId = null;
            live.cancelled = true;
            this._renderMessageNode(live);
        }
        this.setComposerMode('send');
        if (this.inputEl) this.inputEl.disabled = false;
    }

    /**
     * Append streaming chunk to the live assistant message (rAF-throttled).
     * @param {string} chunk - Text chunk (unused directly; fullText is authoritative)
     * @param {string} fullText - Full text so far
     */
    appendChunk(chunk, fullText) {
        const live = this._getMessage(this._liveMessageId);
        if (!live || !live.streaming) return;
        void chunk;
        this._pendingStreamText = fullText;
        if (this._streamRenderHandle) return;

        const render = () => {
            this._streamRenderHandle = null;
            const current = this._getMessage(this._liveMessageId);
            if (!current) return;
            current.text = this._pendingStreamText || '';
            this._updateMessageBody(current);
            this._stickOrPill();
        };
        this._streamRenderHandle = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame(render)
            : setTimeout(render, 50);
    }

    /**
     * Show final result with insert buttons
     * @param {string} text - Complete result text
     */
    /**
     * Finalize the live assistant message with text + split-button footer.
     * @param {string} text - Complete result text
     * @param {Object} [opts] - { readOnly, recommended, messageId, targetChars }
     * @returns {number|null} Message id
     */
    showResult(text, { readOnly = false, recommended = null, messageId = null, targetChars = 0 } = {}) {
        this._cancelStreamRender();
        const msg = this._getMessage(messageId ?? this._liveMessageId) || this._lastAssistantMessage();
        if (!msg) return null;
        msg.text = String(text ?? '');
        msg.streaming = false;
        msg.readOnly = readOnly === true;
        msg.recommended = recommended;
        msg.targetChars = Number(targetChars) || 0;
        if (this._liveMessageId === msg.id) this._liveMessageId = null;
        // Diff-by-default for edit/improve/expand when a diff exists
        if (msg.diffHtml && ['edit', 'improve', 'expand'].includes(msg.action)) msg.showDiff = true;
        this._renderMessageNode(msg);
        this._stickOrPill(true);
        this.setComposerMode('send');
        this._announce('Response complete. Apply actions available.');
        return msg.id;
    }

    // ==================== Message store & rendering ====================

    /**
     * Append a message to the store + thread DOM (FIFO pair eviction at 50).
     * @private
     */
    _appendMessage(kind, text, extra = {}) {
        const prev = this.messages[this.messages.length - 1];
        const id = ++this._messageSeq;
        const msg = {
            id,
            kind,
            text: String(text ?? ''),
            ts: Date.now(),
            grouped: !!prev && prev.kind === kind && (kind === 'user' || kind === 'assistant'),
            action: '',
            model: '',
            streaming: false,
            readOnly: false,
            recommended: null,
            targetChars: 0,
            diffHtml: '',
            showDiff: false,
            expanded: false,
            applied: null,
            stale: false,
            cancelled: false,
            ...extra
        };
        this.messages.push(msg);
        this._evictOldMessages();
        this._clearEmpty();
        const node = this._buildMessageNode(msg);
        msg.el = node;
        this.threadEl?.appendChild(node);
        this._stickOrPill(true);
        return msg;
    }

    /**
     * Evict oldest pairs first (user + following assistant), error/system singles first.
     * @private
     */
    _evictOldMessages() {
        while (this.messages.length > 50) {
            const singleIdx = this.messages.findIndex((m) => m.kind === 'error' || m.kind === 'system');
            if (singleIdx !== -1) {
                this._removeMessage(this.messages[singleIdx]);
                continue;
            }
            const userIdx = this.messages.findIndex((m) => m.kind === 'user');
            if (userIdx === -1) {
                this._removeMessage(this.messages[0]);
                continue;
            }
            this._removeMessage(this.messages[userIdx]);
            if (this.messages[userIdx]?.kind === 'assistant') this._removeMessage(this.messages[userIdx]);
        }
    }

    /**
     * Remove one message from store + DOM.
     * @private
     */
    _removeMessage(msg) {
        if (!msg) return;
        const idx = this.messages.indexOf(msg);
        if (idx !== -1) this.messages.splice(idx, 1);
        if (msg.el?.remove) msg.el.remove();
        if (this._liveMessageId === msg.id) this._liveMessageId = null;
    }

    /**
     * @private
     */
    _getMessage(id) {
        if (id == null) return null;
        return this.messages.find((m) => m.id === id) || null;
    }

    /**
     * @private
     */
    _lastAssistantMessage() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].kind === 'assistant') return this.messages[i];
        }
        return null;
    }

    /**
     * Message text by id (single source of truth for apply).
     * @param {number} id - Message id
     * @returns {string}
     */
    getMessageText(id) {
        return this._getMessage(id)?.text || '';
    }

    /**
     * Build the DOM node for a message.
     * @private
     */
    _buildMessageNode(msg) {
        const node = document.createElement('div');
        node.className = `ai-msg ai-msg-${msg.kind}${msg.grouped ? ' ai-msg-grouped' : ''}`;
        node.dataset.messageId = String(msg.id);
        if (msg.kind === 'assistant' && msg.streaming) {
            node.setAttribute('aria-live', 'off');
        }
        this._paintMessageNode(node, msg);
        return node;
    }

    /**
     * (Re)paint node innerHTML from message state.
     * @private
     */
    _paintMessageNode(node, msg) {
        const label = msg.kind === 'user' ? 'YOU' : msg.kind === 'assistant' ? 'MARKUPSAI' : '';
        const time = new Date(msg.ts);
        const hh = String(time.getHours()).padStart(2, '0');
        const mm = String(time.getMinutes()).padStart(2, '0');
        let inner = '';
        if (label && !msg.grouped) {
            inner += `<div class="ai-msg-label">${this._escapeHtml(label)}</div>`;
        }
        if (msg.kind === 'system') {
            inner += `<div class="ai-msg-system-pill">${this._escapeHtml(msg.text)}</div>`;
        } else if (msg.error) {
            // Partial streamed text is preserved above the card, never destroyed
            if (msg.text) {
                inner += `<div class="ai-msg-body">${this._escapeHtml(msg.text)}</div>`;
            }
            inner += `<div class="ai-msg-error-card" role="alert">`
                + `<div class="ai-msg-error-text">${this._escapeHtml(msg.error.text)}</div>`
                + (msg.error.nextStep ? `<div class="ai-msg-error-next">${this._escapeHtml(msg.error.nextStep)}</div>` : '')
                + `<div class="ai-msg-error-actions">`
                + `<button type="button" data-retry="${msg.id}">Retry</button>`
                + (msg.text ? `<button type="button" data-copy="${msg.id}">Copy partial</button>` : '')
                + (msg.error.showSettings ? `<button type="button" data-open-settings="1">Open settings</button>` : '')
                + `</div></div>`;
        } else if (msg.kind === 'error') {
            inner += `<div class="ai-msg-error-card" role="alert">`
                + `<div class="ai-msg-error-text">${this._escapeHtml(msg.text)}</div>`
                + `<div class="ai-msg-error-next">${this._escapeHtml(msg.nextStep || '')}</div>`
                + `<div class="ai-msg-error-actions">`
                + `<button type="button" data-retry="${msg.id}">Retry</button>`
                + `<button type="button" data-copy="${msg.id}">Copy partial</button>`
                + (msg.showSettings ? `<button type="button" data-open-settings="1">Open settings</button>` : '')
                + `</div></div>`;
        } else {
            inner += this._messageBodyHtml(msg) + this._messageFooterHtml(msg);
        }
        node.innerHTML = inner;
        node.title = `${hh}:${mm}`;
        node.classList.toggle('ai-msg-streaming', !!msg.streaming);
        node.classList.toggle('ai-msg-cancelled', !!msg.cancelled);
    }

    /**
     * Re-render an existing message node in place.
     * @private
     */
    _renderMessageNode(msg) {
        if (!msg?.el?.isConnected) {
            if (!msg || msg.el) return;
            msg.el = this._buildMessageNode(msg);
            this.threadEl?.appendChild(msg.el);
            return;
        }
        this._paintMessageNode(msg.el, msg);
    }

    /**
     * Fast path for streaming: update body text only.
     * @private
     */
    _updateMessageBody(msg) {
        const body = msg.el?.querySelector('.ai-msg-body');
        if (!body) {
            this._renderMessageNode(msg);
            return;
        }
        body.textContent = msg.text;
    }

    /**
     * @private
     */
    _messageBodyHtml(msg) {
        if (msg.cancelled) {
            return `<div class="ai-msg-body ai-msg-cancelled-text">Generation cancelled</div>`;
        }
        if (msg.streaming && !msg.text) {
            return `<div class="ai-msg-body"><span class="ai-thinking"><span></span><span></span><span></span></span> <span class="ai-thinking-text">Thinking…</span></div>`;
        }
        if (msg.showDiff && msg.diffHtml) {
            return `<div class="ai-msg-body ai-msg-diff">${msg.diffHtml}</div>`;
        }
        const lines = msg.text.split('\n').length;
        const collapsed = msg.kind === 'assistant' && !msg.expanded && lines > 12;
        const shown = collapsed ? msg.text.split('\n').slice(0, 12).join('\n') : msg.text;
        return `<div class="ai-msg-body">${this._escapeHtml(shown)}</div>`
            + (collapsed ? `<button type="button" class="ai-msg-more" data-more="${msg.id}">Show more</button>` : '')
            + (msg.expanded && lines > 12 ? `<button type="button" class="ai-msg-more" data-more="${msg.id}">Show less</button>` : '');
    }

    /**
     * Footer: split-button + overflow for assistant, copy for review, chips for review follow-ups.
     * @private
     */
    _messageFooterHtml(msg) {
        if (msg.kind !== 'assistant' || msg.streaming || msg.cancelled) return '';
        if (!msg.text && !msg.diffHtml) return '';
        let html = `<div class="ai-msg-footer">`;
        if (msg.applied) {
            const when = new Date(msg.applied.ts);
            const hh = String(when.getHours()).padStart(2, '0');
            const mm = String(when.getMinutes()).padStart(2, '0');
            html += `<span class="ai-msg-applied-badge">✓ Applied as ${this._escapeHtml(msg.applied.label)} · ${hh}:${mm}</span>`;
        } else if (msg.stale) {
            html += `<span class="ai-msg-stale-badge" title="The document changed while AI was working. Generate again before applying.">Stale — generate again</span>`;
        } else if (msg.readOnly || msg.action === 'review') {
            html += `<button type="button" class="ai-msg-btn" data-copy="${msg.id}" title="Copy to clipboard">Copy</button>`;
        } else {
            const rec = msg.recommended || 'cursor';
            const label = this._applyLabel(rec, msg.targetChars);
            html += `<span class="ai-apply-split">`
                + `<button type="button" class="ai-msg-btn ai-msg-apply" data-apply="${msg.id}" data-mode="${rec}">${this._escapeHtml(label)}</button>`
                + `<button type="button" class="ai-msg-btn ai-msg-menu-btn" data-msg-menu="${msg.id}" title="More apply options" aria-label="More apply options" aria-haspopup="menu">▾</button>`
                + `</span> <button type="button" class="ai-msg-btn ai-msg-overflow" data-overflow="${msg.id}" title="Copy, retry and more" aria-label="More message actions">···</button>`
                + `<div class="ai-msg-menu" data-msg-menu-panel="${msg.id}" role="menu" hidden></div>`;
        }
        if (msg.showDiff && msg.diffHtml) {
            html += ` <button type="button" class="ai-msg-btn" data-diff-toggle="${msg.id}">Show text</button>`;
        } else if (msg.diffHtml) {
            html += ` <button type="button" class="ai-msg-btn" data-diff-toggle="${msg.id}">Show changes</button>`;
        }
        html += `</div>`;
        if (msg.action === 'review' && !msg.streaming && msg.text) {
            html += `<div class="ai-msg-followups" role="list" aria-label="Review follow-ups">`
                + `<button type="button" class="ai-chip" role="listitem" data-followup="fix-issues">Fix issues</button>`
                + `<button type="button" class="ai-chip" role="listitem" data-followup="summarize-fixes">Summarize fixes</button>`
                + `</div>`;
        }
        return html;
    }

    /**
     * @private
     */
    _applyLabel(mode, targetChars) {
        if (mode === 'replace') {
            return targetChars > 0 ? `Apply: Replace (${targetChars} chars)` : 'Apply: Replace';
        }
        if (mode === 'append') return 'Apply: Append';
        return 'Apply: Insert at Cursor';
    }

    /**
     * Fill the per-message overflow menu (other modes + copy + retry).
     * @private
     */
    _fillMessageMenu(msg) {
        const panel = msg.el?.querySelector(`[data-msg-menu-panel="${msg.id}"]`);
        if (!panel) return;
        const modes = ['cursor', 'replace', 'append'].filter((m) => m !== (msg.recommended || 'cursor'));
        const names = { cursor: 'Insert at Cursor', replace: 'Replace Selection', append: 'Append' };
        panel.innerHTML = modes.map((m) =>
            `<button type="button" role="menuitem" class="ai-msg-menu-item" data-menu-apply="${msg.id}" data-mode="${m}">${this._escapeHtml(names[m])}</button>`
        ).join('')
            + `<button type="button" role="menuitem" class="ai-msg-menu-item" data-copy="${msg.id}">Copy</button>`
            + `<button type="button" role="menuitem" class="ai-msg-menu-item" data-retry="${msg.id}">Retry</button>`;
    }

    /**
     * Stick to bottom if near it, else show the ↓ New pill.
     * @private
     */
    _stickOrPill(force = false) {
        const thread = this.threadEl;
        if (!thread) return;
        const nearBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 48;
        if (force || nearBottom) {
            thread.scrollTop = thread.scrollHeight;
            this._hideNewPill();
        } else {
            this._showNewPill();
        }
    }

    /**
     * @private
     */
    _showNewPill() {
        if (!this.threadEl || this.threadEl.querySelector('.ai-new-pill')) return;
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'ai-new-pill';
        pill.textContent = '↓ New';
        pill.setAttribute('aria-label', 'Jump to latest message');
        pill.addEventListener('click', () => {
            if (this.threadEl) this.threadEl.scrollTop = this.threadEl.scrollHeight;
            this._hideNewPill();
        });
        this.threadEl.appendChild(pill);
    }

    /**
     * @private
     */
    _hideNewPill() {
        this.threadEl?.querySelector('.ai-new-pill')?.remove();
    }

    /**
     * Single polite announcement (never per-chunk).
     * @private
     */
    _announce(text) {
        let node = this.panelEl?.querySelector('#ai-announce');
        if (!node) {
            node = document.createElement('div');
            node.id = 'ai-announce';
            node.className = 'ai-sr-only';
            node.setAttribute('role', 'status');
            this.panelEl?.appendChild(node);
        }
        node.textContent = '';
        window.requestAnimationFrame?.(() => { node.textContent = String(text || ''); });
        if (!window.requestAnimationFrame) node.textContent = String(text || '');
    }

    /**
     * Show the current editor selection inside the sidebar.
     * Empty text hides the strip and disables selection-only actions.
     * @param {string} text - Current selected text (may be empty)
     */
    setSelection(text, { hasContent = false } = {}) {
        const selected = String(text || '');
        const hasSelection = selected.trim().length > 0;
        this._selText = selected;
        this._hasContent = hasContent === true;
        // A dismissed snapshot stays hidden until the selection actually changes
        const dismissed = hasSelection && this._dismissedSelection === selected;
        const card = this.contextCardEl;
        if (card) card.hidden = !hasSelection || dismissed;
        if (hasSelection && !dismissed) {
            const clean = selected.replace(/\s+/g, ' ').trim();
            const count = this.panelEl?.querySelector('#ai-selection-count');
            const snippet = this.panelEl?.querySelector('#ai-selection-snippet');
            if (count) count.textContent = `${selected.length} chars selected`;
            if (snippet) snippet.textContent = clean.length > 90 ? `${clean.slice(0, 90)}…` : clean;
        }
        const input = this.inputEl;
        if (input && document.activeElement !== input) {
            input.placeholder = hasSelection
                ? 'How should I change the selected text?'
                : 'Ask MarkupsAI to write, edit, or improve…';
        }
        this.renderChips();
    }

    /**
     * Dismiss the context card (visual pin). Next send goes composer-only.
     * @private
     */
    _dismissSelection() {
        this._dismissedSelection = this._selText || '';
        this._selectionIgnored = true;
        if (this.contextCardEl) this.contextCardEl.hidden = true;
    }

    /**
     * Consume the dismissed-selection flag (manager calls on every send).
     * @returns {boolean} True when the next send must ignore live selection
     */
    consumeSelectionIgnored() {
        const ignored = this._selectionIgnored === true;
        this._selectionIgnored = false;
        return ignored;
    }

    /**
     * Render the 3 contextual suggestion chips. `…` suffix = draft-only, never executes.
     */
    renderChips() {
        const row = this.chipsEl;
        if (!row) return;
        const hasSelection = (this._selText || '').trim().length > 0 && this._dismissedSelection !== this._selText;
        const hasContent = this._hasContent === true;
        let chips;
        if (hasSelection) {
            chips = [
                { label: 'Improve', event: 'ai:action-improve', instant: true },
                { label: 'Fix grammar…', preset: 'Fix grammar: ', action: 'edit', instant: false },
                { label: 'Summarize', event: 'ai:action-summarize', instant: true }
            ];
        } else if (hasContent) {
            chips = [
                { label: 'Continue writing', event: 'ai:action-continue', instant: true },
                { label: 'Review document', event: 'ai:action-review', instant: true },
                { label: 'Generate…', draft: true, instant: false }
            ];
        } else {
            chips = [
                { label: 'Generate…', draft: true, instant: false },
                { label: 'Write an outline…', preset: 'Write an outline for: ', action: 'generate', instant: false }
            ];
        }
        row.replaceChildren();
        for (const chip of chips) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ai-chip';
            btn.setAttribute('role', 'listitem');
            btn.textContent = chip.label;
            btn.addEventListener('click', () => this._runChip(chip));
            row.appendChild(btn);
        }
    }

    /**
     * @private
     */
    _runChip(chip) {
        if (chip.instant && chip.event) {
            eventBus.emit(chip.event);
            return;
        }
        if (this.inputEl) {
            this.inputEl.value = chip.preset || '';
            this._composerAction = chip.action || null;
            this._autoGrow();
            this.updateMeter();
        }
        this.focusInput();
    }

    /**
     * Toggle the ✦ all-actions menu (opens upward, roving tabindex).
     */
    toggleActionsMenu(force) {
        const menu = this.menuEl;
        const btn = this.panelEl?.querySelector('#ai-menu-btn');
        if (!menu) return;
        const open = force !== undefined ? force : menu.hidden;
        if (open) this._renderActionsMenu();
        menu.hidden = !open;
        this._menuOpen = open;
        btn?.setAttribute('aria-expanded', String(open));
        if (open) {
            const first = menu.querySelector('[role="menuitem"]:not([aria-disabled="true"])');
            first?.focus();
        }
    }

    /**
     * @private
     */
    _renderActionsMenu() {
        const menu = this.menuEl;
        if (!menu) return;
        const hasSelection = (this._selText || '').trim().length > 0 && this._dismissedSelection !== this._selText;
        const hasContent = this._hasContent === true;
        const items = [
            { label: 'Generate from prompt', sub: 'Writes new Markdown from your instruction', event: 'ai:action-generate' },
            { label: 'Add at cursor', sub: 'Writes only the new part, keeps the rest', event: 'ai:action-add' },
            { label: 'Continue writing', sub: 'Keeps writing where you stopped', event: 'ai:action-continue', needsDoc: true },
            { label: 'Edit selection…', sub: 'Select text, type instruction below', event: 'ai:action-edit', needsSelection: true, draft: true },
            { label: 'Improve', sub: 'Fixes grammar and readability', event: 'ai:action-improve', needsSelection: true },
            { label: 'Summarize', sub: 'Makes a short summary', event: 'ai:action-summarize', needsSelection: true },
            { label: 'Expand', sub: 'Adds detail and examples', event: 'ai:action-expand', needsSelection: true },
            { label: 'Review document', sub: 'Lists issues, changes nothing', event: 'ai:action-review', needsDoc: true }
        ];
        menu.replaceChildren();
        items.forEach((item, idx) => {
            const blocked = (item.needsSelection && !hasSelection) || (item.needsDoc && !hasContent);
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'ai-menu-item';
            el.setAttribute('role', 'menuitem');
            el.tabIndex = idx === 0 ? 0 : -1;
            const reason = item.needsSelection && !hasSelection ? 'Select text first'
                : item.needsDoc && !hasContent ? 'Document is empty' : item.sub;
            el.title = reason;
            if (blocked) el.setAttribute('aria-disabled', 'true');
            el.innerHTML = `<span class="ai-menu-label">${this._escapeHtml(item.label)}</span>`
                + `<span class="ai-menu-sub">${this._escapeHtml(reason)}</span>`;
            if (!blocked) {
                el.addEventListener('click', () => {
                    this.toggleActionsMenu(false);
                    if (item.draft) {
                        this._composerAction = 'edit';
                        this.focusInput();
                    } else {
                        eventBus.emit(item.event);
                    }
                });
            }
            menu.appendChild(el);
        });
    }

    /**
     * Move focus inside the open menu (roving tabindex).
     * @private
     */
    _moveMenuFocus(delta) {
        const items = [...(this.menuEl?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') || [])];
        if (!items.length) return;
        const current = items.indexOf(document.activeElement);
        const next = items[(current + delta + items.length) % items.length];
        items.forEach((el) => { el.tabIndex = -1; });
        next.tabIndex = 0;
        next.focus();
    }

    /**
     * Composer send/stop morph.
     * @param {'send'|'stop'} mode
     */
    setComposerMode(mode) {
        this._streaming = mode === 'stop';
        const btn = this.sendBtn;
        if (!btn) return;
        if (mode === 'stop') {
            btn.classList.add('ai-send-stop');
            btn.title = 'Stop generation (Esc)';
            btn.setAttribute('aria-label', 'Stop generation');
            btn.innerHTML = '<span class="ai-stop-square" aria-hidden="true"></span>';
        } else {
            btn.classList.remove('ai-send-stop');
            btn.title = 'Send (Enter)';
            btn.setAttribute('aria-label', 'Send message');
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
        }
    }

    /**
     * Token/context meter (fixed 16px row — never shifts layout).
     */
    updateMeter() {
        const meter = this.meterEl;
        if (!meter) return;
        const text = this.inputEl?.value || '';
        if (!text.trim()) {
            meter.textContent = '';
            meter.classList.remove('ai-meter-over');
            return;
        }
        try {
            const tokens = estimateTokens(text);
            const config = aiService.getConfig();
            const budget = config.contextWindow || 32768;
            meter.textContent = `~${tokens.toLocaleString()} tokens · limit ${budget.toLocaleString()}`;
            meter.classList.toggle('ai-meter-over', tokens + (config.maxTokens || 0) > budget);
            if (tokens + (config.maxTokens || 0) > budget) {
                meter.title = 'Exceeds context — shorten selection or raise limit in AI Settings';
            } else {
                meter.title = '';
            }
        } catch {
            meter.textContent = '';
        }
    }

    /**
     * Auto-grow composer 1–4 rows.
     * @private
     */
    _autoGrow() {
        const input = this.inputEl;
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
    }

    /**
     * Handle composer send: queue while streaming, else emit generate/edit.
     * @private
     */
    _sendFromComposer() {
        const text = this.getInput();
        if (!text) return;
        if (this._streaming) {
            const replaced = !!this._queuedFollowUp;
            this._queuedFollowUp = text;
            this.clearInput();
            this._autoGrow();
            this.updateMeter();
            toast.show(replaced ? 'Queued follow-up replaced' : 'Follow-up queued — sends when done', { type: 'info', duration: 1800 });
            return;
        }
        if (!aiService.isConfigured()) {
            this.openSettings();
            this._appendMessage('system', 'Add your API key to start');
            return;
        }
        const action = this._composerAction;
        this._composerAction = null;
        // Pass text in the event — clear AFTER emit would race: generate()
        // reads getInput() and would see an empty box → "Please enter a prompt".
        this.clearInput();
        this._autoGrow();
        this.updateMeter();
        if (action === 'edit') {
            eventBus.emit('ai:action-edit', { instruction: text });
        } else {
            eventBus.emit('ai:action-generate', { prompt: text });
        }
    }

    /**
     * Manager takes the queued follow-up after a stream finalizes.
     * @returns {string|null}
     */
    takeQueuedFollowUp() {
        const text = this._queuedFollowUp;
        this._queuedFollowUp = null;
        return text || null;
    }

    /**
     * Focus the prompt input (used when opened from right-click Edit).
     */
    focusInput() {
        if (this.inputEl) this.inputEl.focus();
    }

    /**
     * Show a line diff inside the live/last assistant message (diff-by-default for edits).
     * Facade kept for manager.
     * @param {string} before - Original text
     * @param {string} after - New text
     */
    showDiff(before, after) {
        const msg = this._getMessage(this._liveMessageId) || this._lastAssistantMessage();
        if (!msg) return;
        msg.diffHtml = renderLineDiffHtml(before, after);
        if (['edit', 'improve', 'expand'].includes(msg.action)) msg.showDiff = true;
        this._renderMessageNode(msg);
        this._stickOrPill();
    }

    /**
     * Convert the live message into an error card. Partial streamed text is kept.
     * @param {string} message - Error message
     * @param {Object} [opts] - { nextStep, showSettings }
     */
    showError(message, { nextStep = '', showSettings = false } = {}) {
        this._cancelStreamRender();
        this.setComposerMode('send');
        let msg = this._getMessage(this._liveMessageId) || this._lastAssistantMessage();
        if (this._liveMessageId != null) this._liveMessageId = null;
        if (!msg || msg.kind !== 'assistant' || (!msg.streaming && msg.text && !msg.cancelled)) {
            msg = this._appendMessage('assistant', '');
        }
        const errText = String(message || 'AI request failed.');
        // Preserve partial text: keep it, append error card below inside the same node
        msg.streaming = false;
        msg.error = { text: errText, nextStep, showSettings };
        this._renderMessageNode(msg);
        this._stickOrPill(true);
        this._announce(`Error. ${errText}`);
        if (this.inputEl) this.inputEl.disabled = false;
    }

    /**
     * Clear the thread back to the empty state.
     */
    clearOutput() {
        this._cancelStreamRender();
        this._liveMessageId = null;
        this._queuedFollowUp = null;
        for (const msg of this.messages) {
            if (msg.el?.remove) msg.el.remove();
        }
        this.messages = [];
        this._renderEmpty();
    }

    /**
     * Start a new chat (confirm-gated when user messages exist).
     */
    newChat() {
        const hasUserMsg = this.messages.some((m) => m.kind === 'user');
        if (this._liveMessageId != null) {
            eventBus.emit(EVENTS.AI_GENERATION_CANCELLED);
        }
        if (!hasUserMsg) {
            this.clearOutput();
            this._appendMessage('system', 'New chat started');
            return;
        }
        const node = document.createElement('div');
        node.className = 'ai-msg ai-msg-confirm';
        node.innerHTML = `<span>Discard this chat?</span>
            <button type="button" data-newchat-keep="1">Keep</button>
            <button type="button" data-newchat-discard="1">Discard</button>`;
        this.threadEl?.appendChild(node);
        this._stickOrPill(true);
        node.querySelector('[data-newchat-discard]')?.focus();
    }

    /**
     * @private
     */
    _confirmDiscardChat(node) {
        this.clearOutput();
        this._appendMessage('system', 'New chat started');
        void node;
    }

    /**
     * Render the empty state (zero messages).
     * @private
     */
    _renderEmpty() {
        const thread = this.threadEl;
        if (!thread || this.messages.length > 0) return;
        const noKey = !aiService.isConfigured();
        const node = document.createElement('div');
        node.className = 'ai-empty';
        node.dataset.empty = '1';
        node.innerHTML = `<div class="ai-empty-glyph" aria-hidden="true">✦</div>`
            + `<p class="ai-empty-title">What should we write?</p>`
            + `<p class="ai-empty-body">Pick a suggestion below or just type — selected text becomes context automatically.</p>`
            + (noKey ? `<button type="button" class="ai-empty-key-btn" data-add-key="1">Add API key</button>` : '');
        thread.appendChild(node);
    }

    /**
     * @private
     */
    _clearEmpty() {
        this.threadEl?.querySelector('[data-empty="1"]')?.remove();
    }

    /**
     * Mark a message's apply controls as done (single-row badge).
     * @param {number} messageId - Message id
     * @param {string} mode - Applied mode label
     */
    markApplied(messageId, mode) {
        const msg = this._getMessage(messageId);
        if (!msg) return;
        const names = { cursor: 'Insert at Cursor', replace: 'Replace', append: 'Append' };
        msg.applied = { label: names[mode] || mode, ts: Date.now() };
        this._renderMessageNode(msg);
    }

    /**
     * Mark a message stale (document changed mid-flight).
     * @param {number} messageId - Message id
     */
    markStale(messageId) {
        const msg = this._getMessage(messageId);
        if (!msg) return;
        msg.stale = true;
        this._renderMessageNode(msg);
    }

    /**
     * Refresh the model tag in the chat header.
     * @private
     */
    _updateHeaderModel() {
        const el = this.panelEl?.querySelector('#ai-header-model');
        if (!el) return;
        try {
            const model = aiService.getConfig()?.model || '';
            el.textContent = model ? `· ${model}` : '';
        } catch {
            el.textContent = '';
        }
    }

    _cancelStreamRender() {
        if (!this._streamRenderHandle) return;
        if (typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._streamRenderHandle);
        } else {
            clearTimeout(this._streamRenderHandle);
        }
        this._streamRenderHandle = null;
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

    dispose() {
        this._cancelStreamRender();
        this._focusTrap?.deactivate();
        this._focusTrap = null;
        if (this._boundDocClick) {
            document.removeEventListener('click', this._boundDocClick);
            this._boundDocClick = null;
        }
        if (this.panelEl) {
            this.panelEl.replaceChildren();
            this.panelEl.style.display = 'none';
        }
        document.getElementById('ai-writer-styles')?.remove();
        document.getElementById('ai-writer-chat-styles')?.remove();
        this.panelEl = null;
        this.threadEl = null;
        this.inputEl = null;
        this.sendBtn = null;
        this.chipsEl = null;
        this.contextCardEl = null;
        this.menuEl = null;
        this.meterEl = null;
        this.statusLineEl = null;
        this.settingsEl = null;
        this.visible = false;
        this.settingsOpen = false;
        this.initialized = false;
        this.messages = [];
        this._messageSeq = 0;
        this._liveMessageId = null;
        this._pendingStreamText = '';
        this._queuedFollowUp = null;
        this._dismissedSelection = null;
        this._selectionIgnored = false;
        this._composerAction = null;
        this._menuOpen = false;
        this._streaming = false;
        this._selText = '';
        this._hasContent = false;
    }

    /**
     * Open AI settings inside the sidebar.
     * @param {Function} [onSave] - Callback after saving settings
     */
    openSettings(onSave) {
        if (!this.panelEl || !this.settingsEl) {
            const container = document.querySelector('#ai-writer-panel');
            if (container) this.renderPanel(container);
        }
        if (!this.settingsEl) return;

        this._onSettingsSave = onSave || null;
        const config = aiService.getConfig();
        const sessionOnlyDefault = aiService.isSessionKey() || !config.rememberKey;
        const body = this.settingsEl.querySelector('#ai-settings-body');
        if (!body) return;

        body.innerHTML = `
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
                        value="${escapeHtml(config.apiKey || '')}">
                    <small class="ai-settings-hint">Stored locally in your browser. Never sent to our servers.</small>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-check" for="ai-set-session-only">
                        <input type="checkbox" id="ai-set-session-only" class="ai-settings-checkbox"
                            ${sessionOnlyDefault ? 'checked' : ''}>
                        Keep key only for this session (don't store it)
                    </label>
                    <small class="ai-settings-hint">Browser-only BYOK mode. Your key is sent directly to the selected provider.</small>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-endpoint">API Endpoint</label>
                    <input type="url" id="ai-set-endpoint" class="ai-settings-input"
                        placeholder="https://api.openai.com/v1"
                        value="${escapeHtml(config.endpoint || '')}">
                    <small class="ai-settings-hint">For custom/self-hosted endpoints. Auto-filled from provider.</small>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-model">Model</label>
                    <div id="ai-model-wrap">${this._modelFieldHtml(config.provider, config.model)}</div>
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
                            min="${AI_LIMITS.minOutputTokens}" max="${AI_LIMITS.maxOutputTokens}" step="100"
                            value="${config.maxTokens}">
                    </div>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-context">Maximum context characters</label>
                    <input type="number" id="ai-set-context" class="ai-settings-input"
                        min="1000" max="${AI_LIMITS.maxContextChars}" step="500"
                        value="${config.contextChars}">
                    <small class="ai-settings-hint">Limits document text sent with a request. Content is never silently expanded beyond this limit.</small>
                </div>

                <div class="ai-settings-group">
                    <label class="ai-settings-label" for="ai-set-instructions">Writing preferences</label>
                    <textarea id="ai-set-instructions" class="ai-settings-input" rows="3"
                        maxlength="2000"
                        placeholder="Example: Keep a concise technical tone and preserve existing heading levels.">${escapeHtml(config.customInstructions || '')}</textarea>
                    <small class="ai-settings-hint">Applied to Markdown writing actions. Do not put secrets here.</small>
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

        this._bindSettingsForm(body);
        this.settingsEl.hidden = false;
        this.settingsOpen = true;
        this.panelEl?.classList.add('ai-settings-open');
        body.querySelector('#ai-set-key')?.focus();
    }

    _modelFieldHtml(provider, currentModel) {
        const models = PROVIDERS[provider]?.models || [];
        const selected = currentModel || PROVIDERS[provider]?.defaultModel || '';
        if (models.length) {
            const options = models.map((m) =>
                `<option value="${escapeHtml(m)}" ${m === selected ? 'selected' : ''}>${escapeHtml(m)}</option>`
            ).join('');
            return `<select id="ai-set-model" class="ai-settings-select">${options}</select>`;
        }
        return `
            <input type="text" id="ai-set-model" class="ai-settings-input"
                placeholder="gpt-4o-mini"
                value="${escapeHtml(selected)}"
                list="ai-model-list">
            <datalist id="ai-model-list"></datalist>
        `;
    }

    closeSettings() {
        if (!this.settingsEl) return;
        this.settingsEl.hidden = true;
        this.settingsOpen = false;
        this.panelEl?.classList.remove('ai-settings-open');
        this._onSettingsSave = null;
    }

    _bindSettingsForm(root) {
        const providerSelect = root.querySelector('#ai-set-provider');
        const endpointInput = root.querySelector('#ai-set-endpoint');
        const modelWrap = root.querySelector('#ai-model-wrap');
        const getModelInput = () => root.querySelector('#ai-set-model');
        const tempRange = root.querySelector('#ai-set-temp');
        const tempValue = root.querySelector('#ai-temp-value');
        const contextInput = root.querySelector('#ai-set-context');
        const instructionsInput = root.querySelector('#ai-set-instructions');
        const testBtn = root.querySelector('#ai-test-connection');
        const testResult = root.querySelector('#ai-test-result');

        providerSelect.addEventListener('change', () => {
            const p = PROVIDERS[providerSelect.value];
            if (p) {
                endpointInput.value = p.baseUrl;
                if (modelWrap) {
                    modelWrap.innerHTML = this._modelFieldHtml(providerSelect.value, p.defaultModel);
                }
            }
        });

        tempRange.addEventListener('input', () => {
            tempValue.textContent = tempRange.value;
        });

        testBtn.addEventListener('click', async () => {
            testResult.textContent = 'Testing...';
            testResult.className = 'ai-test-result';

            const tempConfig = {
                provider: providerSelect.value,
                apiKey: root.querySelector('#ai-set-key').value,
                endpoint: endpointInput.value,
                model: getModelInput()?.value,
                maxTokens: 50,
                temperature: parseFloat(tempRange.value)
            };
            if (!isAllowedEndpoint(tempConfig.endpoint, tempConfig.provider)) {
                testResult.textContent = 'Use HTTPS, or localhost for local models.';
                testResult.className = 'ai-test-result ai-test-fail';
                return;
            }
            if (isCustomEndpoint(tempConfig.endpoint) && !window.confirm(
                `Your API key will be sent directly to:\n${tempConfig.endpoint}\n\nContinue?`
            )) {
                testResult.textContent = 'Test cancelled.';
                return;
            }
            const result = await aiService.testConnection(tempConfig);
            testResult.textContent = result.message;
            testResult.className = `ai-test-result ${result.success ? 'ai-test-success' : 'ai-test-fail'}`;
        });

        this._saveSettingsFromForm = () => {
            const typedKey = root.querySelector('#ai-set-key').value;
            const nextEndpoint = endpointInput.value.trim();
            const prevEndpoint = aiService.getConfig().endpoint;
            if (!isAllowedEndpoint(nextEndpoint, providerSelect.value)) {
                toast.show('Use an HTTPS endpoint, or localhost for local models.', {
                    type: 'error',
                    duration: 3000
                });
                return false;
            }
            if (nextEndpoint && nextEndpoint !== prevEndpoint && isCustomEndpoint(nextEndpoint)) {
                const ok = window.confirm(
                    'Custom AI endpoint\n\nYour API key will be sent to:\n' +
                    nextEndpoint +
                    '\n\nOnly continue if you trust this server. Continue?'
                );
                if (!ok) return false;
            }
            const base = {
                provider: providerSelect.value,
                endpoint: endpointInput.value,
                model: getModelInput()?.value,
                temperature: parseFloat(tempRange.value),
                maxTokens: parseInt(root.querySelector('#ai-set-tokens').value, 10) || AI_LIMITS.defaultOutputTokens,
                contextChars: parseInt(contextInput.value, 10) || AI_LIMITS.maxContextChars,
                customInstructions: instructionsInput.value.trim()
            };
            const sessionOnly = root.querySelector('#ai-set-session-only')?.checked;
            if (sessionOnly) {
                if (typedKey) {
                    aiService.setSessionApiKey(typedKey);
                } else {
                    aiService.clearStoredApiKey();
                }
                aiService.setConfig({ ...base, rememberKey: false });
            } else {
                if (aiService.isSessionKey()) aiService.clearSessionApiKey();
                aiService.setConfig({ ...base, apiKey: typedKey, rememberKey: Boolean(typedKey) });
            }

            toast.show('AI settings saved', { type: 'success', duration: 2000 });
            eventBus.emit(EVENTS.AI_SETTINGS_CHANGED);
            const onSave = this._onSettingsSave;
            this.closeSettings();
            if (onSave) onSave();
            return true;
        };
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

        this.panelEl.querySelector('#ai-settings-back')?.addEventListener('click', () => {
            this.closeSettings();
        });
        this.panelEl.querySelector('#ai-settings-cancel')?.addEventListener('click', () => {
            this.closeSettings();
        });
        this.panelEl.querySelector('#ai-settings-save')?.addEventListener('click', () => {
            this._saveSettingsFromForm?.();
            this._updateHeaderModel();
        });

        // Close button
        this.panelEl.querySelector('#ai-close-btn')?.addEventListener('click', () => {
            if (this.settingsOpen) {
                this.closeSettings();
                return;
            }
            this.toggleActionsMenu(false);
            eventBus.emit(EVENTS.AI_PANEL_TOGGLED, { visible: false });
        });

        // New chat pill
        this.panelEl.querySelector('#ai-newchat-btn')?.addEventListener('click', () => {
            this.newChat();
        });

        // Context card dismiss
        this.panelEl.querySelector('#ai-context-dismiss')?.addEventListener('click', () => {
            this._dismissSelection();
        });

        // Send / Stop morph button
        this.sendBtn?.addEventListener('click', () => {
            if (this._streaming) {
                eventBus.emit(EVENTS.AI_GENERATION_CANCELLED);
                return;
            }
            this._sendFromComposer();
        });

        // ✦ all-actions menu button
        this.panelEl.querySelector('#ai-menu-btn')?.addEventListener('click', () => {
            this.toggleActionsMenu();
        });

        // Click-outside closes the ✦ menu
        this._boundDocClick = (e) => {
            if (!this._menuOpen) return;
            if (e.target?.closest?.('#ai-actions-menu, #ai-menu-btn')) return;
            this.toggleActionsMenu(false);
        };
        document.addEventListener('click', this._boundDocClick);

        // Menu keyboard: Esc closes, arrows move
        this.menuEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleActionsMenu(false);
                this.panelEl?.querySelector('#ai-menu-btn')?.focus();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._moveMenuFocus(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._moveMenuFocus(-1);
            }
        });

        // Thread event delegation (apply / menus / copy / retry / toggles / confirms)
        this.threadEl?.addEventListener('click', (e) => {
            const t = e.target?.closest?.('[data-apply],[data-msg-menu],[data-menu-apply],[data-overflow],[data-copy],[data-retry],[data-diff-toggle],[data-more],[data-followup],[data-newchat-keep],[data-newchat-discard],[data-add-key],[data-open-settings]');
            if (!t) return;
            if (t.hasAttribute('data-apply')) {
                const id = Number(t.dataset.apply);
                const mode = t.dataset.mode || 'cursor';
                eventBus.emit(EVENTS.AI_RESULT_INSERTED, { messageId: id, mode });
            } else if (t.hasAttribute('data-msg-menu') || t.hasAttribute('data-overflow')) {
                const id = Number(t.dataset.msgMenu || t.dataset.overflow);
                const msg = this._getMessage(id);
                if (!msg?.el) return;
                const panel = msg.el.querySelector(`[data-msg-menu-panel="${id}"]`);
                if (!panel) return;
                const willOpen = panel.hidden;
                this.threadEl?.querySelectorAll('.ai-msg-menu').forEach((p) => { p.hidden = true; });
                if (willOpen) {
                    this._fillMessageMenu(msg);
                    panel.hidden = false;
                }
            } else if (t.hasAttribute('data-menu-apply')) {
                eventBus.emit(EVENTS.AI_RESULT_INSERTED, {
                    messageId: Number(t.dataset.menuApply),
                    mode: t.dataset.mode || 'cursor'
                });
            } else if (t.hasAttribute('data-copy')) {
                this._copyMessage(Number(t.dataset.copy), t);
            } else if (t.hasAttribute('data-retry')) {
                eventBus.emit('ai:action-retry');
            } else if (t.hasAttribute('data-diff-toggle')) {
                const msg = this._getMessage(Number(t.dataset.diffToggle));
                if (msg) {
                    msg.showDiff = !msg.showDiff;
                    this._renderMessageNode(msg);
                }
            } else if (t.hasAttribute('data-more')) {
                const msg = this._getMessage(Number(t.dataset.more));
                if (msg) {
                    msg.expanded = !msg.expanded;
                    this._renderMessageNode(msg);
                }
            } else if (t.hasAttribute('data-followup')) {
                eventBus.emit(t.dataset.followup === 'fix-issues' ? 'ai:action-fix-issues' : 'ai:action-summarize-fixes');
            } else if (t.hasAttribute('data-newchat-discard')) {
                this._confirmDiscardChat(t.closest('.ai-msg-confirm'));
            } else if (t.hasAttribute('data-newchat-keep')) {
                t.closest('.ai-msg-confirm')?.remove();
            } else if (t.hasAttribute('data-add-key') || t.hasAttribute('data-open-settings')) {
                this.openSettings();
            }
        });

        // Composer: Enter send (queues while streaming), Esc stops, input grows + meters
        this.inputEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._sendFromComposer();
            } else if (e.key === 'Escape' && this._streaming) {
                e.preventDefault();
                eventBus.emit(EVENTS.AI_GENERATION_CANCELLED);
            }
        });
        this.inputEl?.addEventListener('input', () => {
            this._autoGrow();
            this.updateMeter();
        });
    }

    /**
     * Copy a message's text with inline confirmation.
     * @private
     */
    _copyMessage(id, btn) {
        const text = this.getMessageText(id);
        if (!text) return;
        const done = () => {
            if (btn && btn.isConnected) {
                const original = btn.textContent;
                btn.textContent = '✓ Copied';
                setTimeout(() => { if (btn.isConnected) btn.textContent = original; }, 1500);
            } else {
                toast.show('Copied to clipboard', { type: 'success', duration: 1500 });
            }
        };
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => {
                toast.show('Failed to copy', { type: 'error', duration: 1500 });
            });
        } else {
            toast.show('Copy not available', { type: 'warning', duration: 1500 });
        }
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
                position: relative;
                flex: 0 0 360px;
                width: 360px;
                min-width: 280px;
                max-width: 100%;
                background: var(--ai-bg, #ffffff);
                border-left: 1px solid var(--ai-border, #e5e7eb);
                display: flex;
                flex-direction: column;
                z-index: 50;
                overflow: hidden;
                box-shadow: -4px 0 20px rgba(0, 0, 0, 0.08);
                animation: aiSlideIn 0.2s ease-out;
            }

            body.view-editor .ai-writer-panel {
                display: none !important;
            }

            @media (max-width: 1100px) and (min-width: 769px) {
                .ai-writer-panel {
                    flex-basis: 320px;
                    width: 320px;
                }
            }

            @keyframes aiSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .ai-panel-inner {
                position: relative;
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
                flex-direction: column;
                gap: 4px;
                padding: 10px 14px;
                border-bottom: 1px solid var(--ai-border, #e5e7eb);
                flex-shrink: 0;
                overflow-y: auto;
            }

            .ai-actions-group-label {
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: var(--ai-muted, #6b7280);
                margin-top: 2px;
            }

            .ai-actions-group {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
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

            .ai-action-btn:disabled,
            .ai-action-btn.ai-action-disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .ai-action-btn:disabled:hover,
            .ai-action-btn.ai-action-disabled:hover {
                background: transparent;
                color: var(--ai-text, #374151);
                border-color: var(--ai-border, #e5e7eb);
            }

            /* Selection strip — mirrors the editor selection inside the sidebar */
            .ai-selection-strip {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding: 8px 14px;
                border-bottom: 1px solid var(--ai-border, #e5e7eb);
                background: var(--ai-status-bg, #f5f3ff);
                flex-shrink: 0;
            }

            .ai-selection-strip[hidden] {
                display: none !important;
            }

            .ai-selection-strip-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
            }

            .ai-selection-strip-label {
                font-size: 11px;
                font-weight: 700;
                color: var(--ai-accent, #8b5cf6);
            }

            .ai-selection-strip-snippet {
                font-size: 11px;
                color: var(--ai-muted, #6b7280);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 220px;
            }

            .ai-selection-strip-hint {
                font-size: 10px;
                color: var(--ai-muted, #6b7280);
                white-space: nowrap;
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

            .ai-diff-output {
                white-space: normal;
                font-size: 12px;
            }

            .ai-diff-line {
                padding: 2px 6px;
                white-space: pre-wrap;
                border-left: 3px solid transparent;
            }

            .ai-diff-prefix {
                display: inline-block;
                width: 16px;
                user-select: none;
                opacity: 0.65;
            }

            .ai-diff-added {
                background: rgba(16, 185, 129, 0.12);
                border-left-color: #10b981;
            }

            .ai-diff-removed {
                background: rgba(239, 68, 68, 0.12);
                border-left-color: #ef4444;
                text-decoration: line-through;
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
            .ai-insert-hint {
                font-size: 11px;
                color: var(--ai-muted, #6b7280);
                padding: 8px 14px 0;
                flex-shrink: 0;
            }

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

            /* ==================== In-sidebar settings ==================== */
            .ai-settings-sheet {
                position: absolute;
                inset: 0;
                z-index: 4;
                display: flex;
                flex-direction: column;
                background: var(--ai-bg, #ffffff);
            }

            .ai-settings-sheet[hidden] {
                display: none !important;
            }

            .ai-settings-sheet-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 10px 10px 6px;
                border-bottom: 1px solid var(--ai-border, #e5e7eb);
                flex-shrink: 0;
            }

            .ai-settings-sheet-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--ai-title-color, #111827);
            }

            .ai-settings-sheet-body {
                flex: 1;
                overflow-y: auto;
                padding: 14px;
                min-height: 0;
            }

            .ai-settings-sheet-footer {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                padding: 10px 14px;
                border-top: 1px solid var(--ai-border, #e5e7eb);
                flex-shrink: 0;
            }

            .ai-settings-cancel,
            .ai-settings-save {
                padding: 7px 12px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
            }

            .ai-settings-cancel {
                border: 1px solid var(--ai-border, #e5e7eb);
                background: var(--ai-btn-bg, #f9fafb);
                color: var(--ai-text, #374151);
            }

            .ai-settings-save {
                border: none;
                background: var(--ai-accent, #8b5cf6);
                color: #fff;
            }

            .ai-settings-form {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .ai-settings-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .ai-settings-row {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
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

            .ai-settings-check {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                font-size: 13px;
                color: var(--ai-text, #374151);
                line-height: 1.4;
            }

            .ai-settings-checkbox {
                margin-top: 2px;
                accent-color: var(--ai-accent, #8b5cf6);
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
            .toolbar-btn.ai-active,
            .header-btn.ai-active {
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
                body.view-editor .ai-writer-panel:not([style*="display: none"]) {
                    display: flex !important;
                }

                .ai-writer-panel {
                    width: 100%;
                    min-width: 0;
                    flex-basis: auto;
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

    /**
     * Chatbot-thread styles (spec §2–§4, §6, §12–§13). Legacy rules above stay
     * for the settings sheet + panel shell; removed markup has no live rules here.
     * @private
     */
    _injectChatStyles() {
        const styleId = 'ai-writer-chat-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            /* ==================== AI Chat Thread ==================== */
            .ai-panel-inner {
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .ai-chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 48px;
                flex-shrink: 0;
                padding: 0 8px 0 14px;
                border-bottom: 1px solid var(--ai-border, #e5e7eb);
            }

            .ai-header-model {
                font-size: 11px;
                font-weight: 400;
                color: var(--ai-muted, #6b7280);
                margin-left: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 140px;
            }

            .ai-newchat-row {
                flex-shrink: 0;
                padding: 8px 14px 0;
            }

            .ai-newchat-pill {
                font-size: 12px;
                font-weight: 600;
                padding: 5px 12px;
                min-height: 32px;
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 8px;
                background: transparent;
                color: var(--ai-text, #374151);
                cursor: pointer;
            }

            .ai-newchat-pill:hover {
                border-color: var(--ai-accent, #8b5cf6);
                color: var(--ai-accent, #8b5cf6);
            }

            /* Context card (replaces selection strip) */
            .ai-context-card {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 8px 14px 0;
                padding: 8px 8px 8px 12px;
                border: 1px solid var(--ai-border, #e5e7eb);
                border-left: 3px solid var(--ai-accent, #8b5cf6);
                border-radius: 8px;
                background: var(--ai-status-bg, #f5f3ff);
                flex-shrink: 0;
            }

            .ai-context-card[hidden] {
                display: none !important;
            }

            .ai-context-card-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
                flex: 1;
            }

            .ai-context-card-label {
                font-size: 11px;
                font-weight: 600;
                color: var(--ai-accent, #8b5cf6);
            }

            .ai-context-card-snippet {
                font-size: 11px;
                color: var(--ai-muted, #6b7280);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .ai-context-card-hint {
                font-size: 10px;
                color: var(--ai-muted, #6b7280);
                white-space: nowrap;
            }

            .ai-context-dismiss {
                flex-shrink: 0;
                font-size: 14px;
                line-height: 1;
            }

            /* Thread */
            .ai-thread {
                flex: 1;
                overflow-y: auto;
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                position: relative;
            }

            .ai-msg {
                display: flex;
                flex-direction: column;
                gap: 4px;
                max-width: 100%;
            }

            .ai-msg-label {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--ai-muted, #6b7280);
            }

            .ai-msg-grouped {
                margin-top: -4px;
            }

            .ai-msg-user {
                align-items: flex-end;
            }

            .ai-msg-user .ai-msg-body {
                background: var(--ai-bubble-user, var(--bg-tertiary, #f1f5f9));
                border-radius: 12px 12px 4px 12px;
                padding: 8px 12px;
                font-size: 13px;
                line-height: 1.6;
                max-width: 85%;
                white-space: pre-wrap;
                word-break: break-word;
                color: var(--ai-text, #374151);
            }

            .ai-msg-assistant .ai-msg-body {
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 12px;
                padding: 8px 12px;
                font-size: 13px;
                line-height: 1.6;
                font-family: var(--font-mono, ui-monospace, monospace);
                white-space: pre-wrap;
                word-break: break-word;
                color: var(--ai-text, #374151);
                background: transparent;
            }

            .ai-msg-streaming .ai-msg-body {
                border: 2px solid var(--ai-accent, #8b5cf6);
            }

            .ai-msg-streaming .ai-msg-body::after {
                content: '▍';
                color: var(--ai-accent, #8b5cf6);
                animation: ai-cursor-blink 1s steps(1) infinite;
            }

            @keyframes ai-cursor-blink {
                50% { opacity: 0; }
            }

            .ai-thinking span {
                display: inline-block;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--ai-muted, #6b7280);
                margin-right: 3px;
                animation: ai-dot-pulse 1.2s infinite;
            }

            .ai-thinking span:nth-child(2) { animation-delay: 0.2s; }
            .ai-thinking span:nth-child(3) { animation-delay: 0.4s; }

            @keyframes ai-dot-pulse {
                0%, 60%, 100% { opacity: 0.3; }
                30% { opacity: 1; }
            }

            .ai-thinking-text {
                font-size: 12px;
                color: var(--ai-muted, #6b7280);
            }

            .ai-msg-system-pill {
                align-self: center;
                font-size: 12px;
                color: var(--ai-muted, #6b7280);
                background: var(--ai-hover-bg, #f3f4f6);
                border-radius: 12px;
                padding: 4px 12px;
                text-align: center;
            }

            .ai-msg-error-card {
                border: 1px solid #fecaca;
                background: #fef2f2;
                color: #991b1b;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 13px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .ai-msg-error-next {
                font-size: 12px;
                opacity: 0.85;
            }

            .ai-msg-error-actions {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }

            .ai-msg-error-actions button {
                font-size: 12px;
                padding: 4px 10px;
                border-radius: 6px;
                border: 1px solid currentColor;
                background: transparent;
                color: inherit;
                cursor: pointer;
            }

            .ai-msg-diff {
                font-family: var(--font-mono, ui-monospace, monospace);
                max-height: 240px;
                overflow-y: auto;
            }

            .ai-msg-more {
                align-self: flex-start;
                font-size: 12px;
                color: var(--ai-accent, #8b5cf6);
                background: none;
                border: none;
                cursor: pointer;
                padding: 2px 0;
            }

            /* Message footer: split-button + overflow */
            .ai-msg-footer {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                position: relative;
            }

            .ai-apply-split {
                display: inline-flex;
            }

            .ai-apply-split .ai-msg-apply {
                border-radius: 8px 0 0 8px;
                border-right: none;
            }

            .ai-apply-split .ai-msg-menu-btn {
                border-radius: 0 8px 8px 0;
            }

            .ai-msg-btn {
                font-size: 12px;
                font-weight: 600;
                padding: 5px 10px;
                border-radius: 8px;
                border: 1px solid var(--ai-accent, #8b5cf6);
                background: var(--ai-accent, #8b5cf6);
                color: #fff;
                cursor: pointer;
                white-space: nowrap;
            }

            .ai-msg-btn.ai-msg-menu-btn,
            .ai-msg-btn.ai-msg-overflow {
                background: transparent;
                color: var(--ai-accent, #8b5cf6);
                padding: 5px 8px;
            }

            .ai-msg-footer .ai-msg-btn[data-copy] {
                background: transparent;
                color: var(--ai-text, #374151);
                border-color: var(--ai-border, #e5e7eb);
                font-weight: 400;
            }

            .ai-msg-menu {
                position: absolute;
                bottom: calc(100% + 6px);
                left: 0;
                min-width: 180px;
                background: var(--ai-bg, #fff);
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                padding: 4px;
                z-index: 5;
                display: flex;
                flex-direction: column;
            }

            .ai-msg-menu[hidden] {
                display: none;
            }

            .ai-msg-menu-item {
                text-align: left;
                font-size: 12px;
                padding: 7px 10px;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: var(--ai-text, #374151);
                cursor: pointer;
            }

            .ai-msg-menu-item:hover {
                background: var(--ai-hover-bg, #f3f4f6);
            }

            .ai-msg-applied-badge {
                font-size: 12px;
                color: var(--accent-success, #22c55e);
                font-weight: 600;
            }

            .ai-msg-stale-badge {
                font-size: 12px;
                color: var(--ai-muted, #6b7280);
                font-style: italic;
            }

            .ai-msg-followups {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }

            .ai-msg-confirm {
                flex-direction: row;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 8px;
                padding: 8px 12px;
            }

            .ai-msg-confirm button {
                font-size: 12px;
                padding: 4px 10px;
                border-radius: 6px;
                border: 1px solid var(--ai-border, #e5e7eb);
                background: transparent;
                cursor: pointer;
            }

            /* Empty state */
            .ai-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 6px;
                padding: 32px 12px;
                color: var(--ai-muted, #6b7280);
            }

            .ai-empty-glyph {
                font-size: 32px;
                opacity: 0.3;
            }

            .ai-empty-title {
                font-size: 13px;
                font-weight: 600;
                color: var(--ai-text, #374151);
                margin: 4px 0 0;
            }

            .ai-empty-body {
                font-size: 12px;
                margin: 0;
            }

            .ai-empty-key-btn {
                margin-top: 8px;
                font-size: 12px;
                font-weight: 600;
                padding: 7px 14px;
                border-radius: 8px;
                border: none;
                background: var(--ai-accent, #8b5cf6);
                color: #fff;
                cursor: pointer;
            }

            /* Chips */
            .ai-chips-row {
                display: flex;
                gap: 6px;
                padding: 8px 14px;
                overflow-x: auto;
                flex-shrink: 0;
            }

            .ai-chips-row:empty {
                display: none;
            }

            .ai-chip {
                flex-shrink: 0;
                font-size: 12px;
                padding: 5px 12px;
                border-radius: 8px;
                border: 1px solid var(--ai-border, #e5e7eb);
                background: transparent;
                color: var(--ai-text, #374151);
                cursor: pointer;
                white-space: nowrap;
            }

            .ai-chip:hover {
                border-color: var(--ai-accent, #8b5cf6);
                color: var(--ai-accent, #8b5cf6);
            }

            /* Composer */
            .ai-composer {
                flex-shrink: 0;
                padding: 8px 14px 12px;
                border-top: 1px solid var(--ai-border, #e5e7eb);
                position: relative;
            }

            .ai-composer-row {
                display: flex;
                align-items: flex-end;
                gap: 8px;
            }

            .ai-actions-menu-btn {
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                border: 1px solid var(--ai-border, #e5e7eb);
                background: transparent;
                color: var(--ai-accent, #8b5cf6);
                font-size: 15px;
                cursor: pointer;
            }

            .ai-actions-menu-btn:hover {
                border-color: var(--ai-accent, #8b5cf6);
            }

            .ai-composer .ai-panel-input {
                flex: 1;
                min-height: 32px;
                max-height: 96px;
                resize: none;
            }

            .ai-panel-send.ai-send-stop {
                background: var(--ai-text, #374151);
                border-color: var(--ai-text, #374151);
            }

            .ai-stop-square {
                display: block;
                width: 12px;
                height: 12px;
                background: #fff;
                border-radius: 2px;
            }

            .ai-meter {
                height: 16px;
                font-size: 11px;
                text-align: right;
                color: var(--ai-muted, #6b7280);
            }

            .ai-meter-over {
                color: #dc2626;
                font-weight: 600;
            }

            /* ✦ menu (opens upward) */
            .ai-actions-menu {
                position: absolute;
                bottom: calc(100% + 8px);
                left: 14px;
                width: 280px;
                max-height: 320px;
                overflow-y: auto;
                background: var(--ai-bg, #fff);
                border: 1px solid var(--ai-border, #e5e7eb);
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                padding: 4px;
                z-index: 6;
            }

            .ai-actions-menu[hidden] {
                display: none;
            }

            .ai-menu-item {
                display: flex;
                flex-direction: column;
                gap: 1px;
                width: 100%;
                text-align: left;
                padding: 7px 10px;
                border: none;
                border-radius: 6px;
                background: transparent;
                cursor: pointer;
            }

            .ai-menu-item:hover:not([aria-disabled="true"]) {
                background: var(--ai-hover-bg, #f3f4f6);
            }

            .ai-menu-item[aria-disabled="true"] {
                opacity: 0.45;
                cursor: not-allowed;
            }

            .ai-menu-label {
                font-size: 13px;
                font-weight: 600;
                color: var(--ai-text, #374151);
            }

            .ai-menu-sub {
                font-size: 11px;
                color: var(--ai-muted, #6b7280);
            }

            /* ↓ New pill */
            .ai-new-pill {
                position: absolute;
                bottom: 12px;
                left: 50%;
                transform: translateX(-50%);
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: none;
                background: var(--ai-accent, #8b5cf6);
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                z-index: 4;
            }

            .ai-sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                overflow: hidden;
                clip: rect(0 0 0 0);
                white-space: nowrap;
            }

            .ai-msg-btn:focus-visible,
            .ai-chip:focus-visible,
            .ai-menu-item:focus-visible,
            .ai-newchat-pill:focus-visible,
            .ai-actions-menu-btn:focus-visible,
            .ai-panel-send:focus-visible,
            .ai-panel-input:focus-visible {
                outline: 2px solid var(--ai-accent, #8b5cf6);
                outline-offset: 2px;
            }

            @media (prefers-reduced-motion: reduce) {
                .ai-msg-streaming .ai-msg-body::after {
                    animation: none;
                }
                .ai-thinking span {
                    animation: none;
                    opacity: 0.7;
                }
            }

            @media (max-width: 768px) {
                .ai-composer {
                    padding-bottom: calc(12px + env(safe-area-inset-bottom));
                }
                .ai-newchat-pill,
                .ai-panel-header-actions .ai-panel-btn-icon {
                    min-width: 44px;
                    min-height: 44px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

export const aiWriterUI = new AIWriterUI();

export { AIWriterUI };

export default aiWriterUI;
