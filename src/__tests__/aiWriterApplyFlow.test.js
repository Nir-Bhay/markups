/**
 * Tests for the AI apply flow (Phase: sidebar UX):
 * - getRecommendedApplyMode picks the right insert button per action
 * - setSelection mirrors the editor selection into the sidebar strip
 * - showResult highlights the suggested apply button with a hint
 * - editor right-click menu exposes AI items only when text is selected
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../utils/clipboard.js', () => ({
    copyToClipboard: vi.fn(),
    readFromClipboard: vi.fn(() => Promise.resolve(''))
}));

import { getRecommendedApplyMode } from '../features/ai-writer/index.js';
import { aiWriterUI } from '../features/ai-writer/ui.js';
import { aiService } from '../features/ai-writer/service.js';
import { eventBus } from '../utils/eventBus.js';
import { editorService } from '../core/editor/index.js';
import { AppContextMenuManager } from '../features/app-context-menu/index.js';

describe('getRecommendedApplyMode', () => {
    it('suggests replace for selection actions when a selection was captured', () => {
        const target = { selectedText: 'some text' };
        for (const action of ['edit', 'improve', 'summarize', 'expand']) {
            expect(getRecommendedApplyMode(action, target)).toBe('replace');
        }
    });

    it('falls back to cursor for selection actions without a selection', () => {
        expect(getRecommendedApplyMode('edit', null)).toBe('cursor');
        expect(getRecommendedApplyMode('improve', { selectedText: '   ' })).toBe('cursor');
    });

    it('suggests cursor for new-content actions', () => {
        for (const action of ['generate', 'add', 'continue', undefined, 'unknown']) {
            expect(getRecommendedApplyMode(action, { selectedText: 'x' })).toBe('cursor');
        }
    });

    it('suggests nothing for read-only review', () => {
        expect(getRecommendedApplyMode('review', null)).toBeNull();
    });
});

describe('aiWriterUI chat thread', () => {
    let container;
    let emitSpy;
    let configuredSpy;

    beforeEach(() => {
        aiWriterUI.dispose?.();
        aiWriterUI.initialize();
        container = document.createElement('aside');
        container.id = 'ai-writer-panel';
        document.body.appendChild(container);
        aiWriterUI.renderPanel(container);
        emitSpy = vi.spyOn(eventBus, 'emit').mockImplementation(() => {});
    });

    afterEach(() => {
        emitSpy?.mockRestore();
        configuredSpy?.mockRestore();
        aiWriterUI.dispose?.();
        container?.remove();
    });

    const enableSend = () => {
        configuredSpy = vi.spyOn(aiService, 'isConfigured').mockReturnValue(true);
    };

    it('shows the context card with a snippet when text is selected', () => {
        aiWriterUI.setSelection('Hello world from the editor', { hasContent: true });
        const card = container.querySelector('#ai-context-card');
        expect(card.hidden).toBe(false);
        expect(container.querySelector('#ai-selection-count').textContent).toContain('chars selected');
        expect(container.querySelector('#ai-selection-snippet').textContent).toContain('Hello world');
    });

    it('hides the context card without a selection and renders doc-state chips', () => {
        aiWriterUI.setSelection('something', { hasContent: true });
        aiWriterUI.setSelection('', { hasContent: true });
        expect(container.querySelector('#ai-context-card').hidden).toBe(true);
        const labels = Array.from(container.querySelectorAll('#ai-chips .ai-chip')).map((el) => el.textContent);
        expect(labels).toEqual(['Continue writing', 'Review document', 'Generate…']);
    });

    it('dismissing the card flags composer-only mode until consumed', () => {
        aiWriterUI.setSelection('selected text', { hasContent: true });
        container.querySelector('#ai-context-dismiss').click();
        expect(container.querySelector('#ai-context-card').hidden).toBe(true);
        expect(aiWriterUI.consumeSelectionIgnored()).toBe(true);
        expect(aiWriterUI.consumeSelectionIgnored()).toBe(false);
    });

    it('showStatus creates user + live assistant messages and streams', async () => {
        const id = aiWriterUI.showStatus({ userLabel: 'Write hello', action: 'generate' });
        expect(typeof id).toBe('number');
        const bodies = container.querySelectorAll('.ai-msg-user .ai-msg-body');
        expect(bodies[bodies.length - 1].textContent).toBe('Write hello');
        expect(container.querySelector('.ai-msg-streaming')).not.toBeNull();
        aiWriterUI.appendChunk('Hel', 'Hello');
        await new Promise((resolve) => setTimeout(resolve, 80));
        aiWriterUI.showResult('Hello', { recommended: 'cursor' });
        expect(aiWriterUI.lastResult).toBe('Hello');
        expect(container.querySelector('.ai-msg-streaming')).toBeNull();
        const applyBtn = container.querySelector(`[data-apply="${id}"]`);
        expect(applyBtn.textContent).toContain('Insert at Cursor');
    });

    it('supports the legacy string showStatus call without a user message', () => {
        aiWriterUI.showStatus('Generating...');
        expect(container.querySelectorAll('.ai-msg-user').length).toBe(0);
        expect(container.querySelector('.ai-msg-streaming')).not.toBeNull();
    });

    it('split-button recommends Replace with char count', () => {
        const id = aiWriterUI.showStatus({ userLabel: 'Improve selected text', action: 'improve' });
        aiWriterUI.showResult('better text', { recommended: 'replace', targetChars: 120 });
        const applyBtn = container.querySelector(`[data-apply="${id}"]`);
        expect(applyBtn.textContent).toBe('Apply: Replace (120 chars)');
    });

    it('review results render Copy only plus follow-up chips', () => {
        aiWriterUI.showStatus({ userLabel: 'Review document', action: 'review' });
        aiWriterUI.showResult('1. Fix typo', { readOnly: true, recommended: null });
        expect(container.querySelector('[data-apply]')).toBeNull();
        expect(container.querySelector('[data-copy]')).not.toBeNull();
        const followups = Array.from(container.querySelectorAll('[data-followup]')).map((el) => el.textContent);
        expect(followups).toEqual(['Fix issues', 'Summarize fixes']);
    });

    it('edit results show the diff by default with a Show text toggle', () => {
        aiWriterUI.showStatus({ userLabel: 'Improve selected text', action: 'improve' });
        aiWriterUI.showDiff('old line', 'new line');
        aiWriterUI.showResult('new line', { recommended: 'replace', targetChars: 8 });
        expect(container.querySelector('.ai-msg-diff')).not.toBeNull();
        const toggle = container.querySelector('[data-diff-toggle]');
        expect(toggle.textContent).toBe('Show text');
        toggle.click();
        expect(container.querySelector('.ai-msg-diff')).toBeNull();
    });

    it('collapses long replies behind Show more', () => {
        const longText = Array.from({ length: 13 }, (_, i) => `line ${i + 1}`).join('\n');
        aiWriterUI.showStatus({ userLabel: 'Write more', action: 'generate' });
        aiWriterUI.showResult(longText, { recommended: 'append' });
        const more = container.querySelector('[data-more]');
        expect(more.textContent).toBe('Show more');
        expect(container.querySelector('.ai-msg-assistant .ai-msg-body').textContent).not.toContain('line 13');
        more.click();
        expect(container.querySelector('[data-more]').textContent).toBe('Show less');
        expect(container.querySelector('.ai-msg-assistant .ai-msg-body').textContent).toContain('line 13');
    });

    it('marks applied and stale states on the message', () => {
        const id = aiWriterUI.showStatus({ userLabel: 'x', action: 'generate' });
        aiWriterUI.showResult('done', { recommended: 'cursor' });
        aiWriterUI.markApplied(id, 'cursor');
        expect(container.querySelector('.ai-msg-applied-badge').textContent).toContain('Insert at Cursor');
        aiWriterUI.markStale(id);
        // Applied wins once set; fresh message shows stale
        const id2 = aiWriterUI.showStatus({ userLabel: 'y', action: 'generate' });
        aiWriterUI.showResult('done 2', { recommended: 'cursor' });
        aiWriterUI.markStale(id2);
        const badges = container.querySelectorAll('.ai-msg-stale-badge');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('error cards keep partial text and offer Retry', () => {
        const id = aiWriterUI.showStatus({ userLabel: 'x', action: 'generate' });
        aiWriterUI._getMessage(id).text = 'partial';
        aiWriterUI.showError('boom', { nextStep: 'Reconnect, then Retry.' });
        expect(container.querySelector('.ai-msg-error-card')).not.toBeNull();
        expect(container.textContent).toContain('partial');
        expect(container.textContent).toContain('Reconnect, then Retry.');
        container.querySelector('[data-retry]').click();
        expect(emitSpy).toHaveBeenCalledWith('ai:action-retry');
    });

    it('instant chips emit immediately, draft chips fill the composer', () => {
        aiWriterUI.setSelection('some text', { hasContent: true });
        const chips = Array.from(container.querySelectorAll('#ai-chips .ai-chip'));
        expect(chips.map((el) => el.textContent)).toEqual(['Improve', 'Fix grammar…', 'Summarize']);
        chips[0].click();
        expect(emitSpy).toHaveBeenCalledWith('ai:action-improve');
        chips[1].click();
        expect(aiWriterUI.getInput()).toBe('Fix grammar:');
        expect(emitSpy).not.toHaveBeenCalledWith('ai:action-edit');
    });

    it('✦ menu lists 8 actions and disables selection items without selection', () => {
        aiWriterUI.setSelection('', { hasContent: true });
        aiWriterUI.toggleActionsMenu(true);
        const items = container.querySelectorAll('#ai-actions-menu [role="menuitem"]');
        expect(items.length).toBe(8);
        const disabled = Array.from(items).filter((el) => el.getAttribute('aria-disabled') === 'true');
        expect(disabled.length).toBe(4);
        aiWriterUI.toggleActionsMenu(false);
        expect(container.querySelector('#ai-actions-menu').hidden).toBe(true);
    });

    it('queues follow-ups typed mid-stream instead of sending', () => {
        enableSend();
        aiWriterUI.showStatus({ userLabel: 'first', action: 'generate' });
        aiWriterUI.inputEl.value = 'follow up';
        aiWriterUI._sendFromComposer();
        expect(emitSpy).not.toHaveBeenCalledWith('ai:action-generate');
        expect(aiWriterUI.takeQueuedFollowUp()).toBe('follow up');
        expect(aiWriterUI.takeQueuedFollowUp()).toBeNull();
    });

    it('sends composer text as generate when idle', () => {
        enableSend();
        aiWriterUI.inputEl.value = 'hello ai';
        aiWriterUI._sendFromComposer();
        expect(emitSpy).toHaveBeenCalledWith('ai:action-generate', { prompt: 'hello ai' });
        expect(aiWriterUI.getInput()).toBe('');
    });

    it('passes edit instruction from composer without losing it after clear', () => {
        enableSend();
        aiWriterUI._composerAction = 'edit';
        aiWriterUI.inputEl.value = 'make it shorter';
        aiWriterUI._sendFromComposer();
        expect(emitSpy).toHaveBeenCalledWith('ai:action-edit', { instruction: 'make it shorter' });
        expect(aiWriterUI.getInput()).toBe('');
    });

    it('new chat confirms when user messages exist', () => {
        aiWriterUI.showStatus({ userLabel: 'hi', action: 'generate' });
        aiWriterUI.showResult('hello', { recommended: 'cursor' });
        aiWriterUI.newChat();
        expect(container.querySelector('[data-newchat-discard]')).not.toBeNull();
        container.querySelector('[data-newchat-discard]').click();
        expect(container.querySelectorAll('.ai-msg-user').length).toBe(0);
        expect(container.textContent).toContain('New chat started');
    });

    it('evicts oldest pairs past 50 messages', () => {
        for (let i = 0; i < 30; i++) {
            aiWriterUI.showStatus({ userLabel: `q${i}`, action: 'generate' });
            aiWriterUI.showResult(`a${i}`, { recommended: 'cursor' });
        }
        expect(aiWriterUI.messages.length).toBeLessThanOrEqual(50);
    });
});

describe('editorService.attachEditor (production entry)', () => {
    const listenerStub = () => ({ dispose: () => {} });

    const makeFakeEditor = () => ({
        onDidChangeModelContent: vi.fn((cb) => {
            void cb;
            return listenerStub();
        }),
        onDidChangeCursorPosition: vi.fn(() => listenerStub()),
        onDidChangeCursorSelection: vi.fn(() => listenerStub()),
        onDidScrollChange: vi.fn(() => listenerStub()),
        getValue: () => '# Doc',
        getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 }),
        getModel: () => ({ getValueInRange: () => '# Do' })
    });

    afterEach(() => {
        editorService.editor = null;
        editorService.initialized = false;
        editorService.disposables = [];
    });

    it('rejects invalid instances without touching the service', () => {
        expect(editorService.attachEditor(null)).toBeNull();
        expect(editorService.attachEditor({})).toBeNull();
        expect(editorService.getEditor()).toBeNull();
    });

    it('adopts the live editor and exposes value + selection', () => {
        const fake = makeFakeEditor();
        expect(editorService.attachEditor(fake)).toBe(fake);
        expect(editorService.getEditor()).toBe(fake);
        expect(editorService.getValue()).toBe('# Doc');
        expect(editorService.getSelectedText()).toBe('# Do');
        expect(fake.onDidChangeModelContent).toHaveBeenCalled();
        expect(fake.onDidChangeCursorSelection).toHaveBeenCalled();
    });
});

describe('editor context menu AI items', () => {
    let manager;
    let originalGetSelectedText;

    beforeEach(() => {
        manager = new AppContextMenuManager();
        originalGetSelectedText = editorService.getSelectedText;
    });

    afterEach(() => {
        editorService.getSelectedText = originalGetSelectedText;
    });

    it('shows AI items when text is selected', () => {
        editorService.getSelectedText = () => 'selected text';
        const labels = manager._buildEditorMenu().map((el) => el.textContent);
        expect(labels).toContain('Edit with AI…');
        expect(labels).toContain('Improve with AI');
        expect(labels).toContain('Summarize with AI');
        expect(labels).toContain('Expand with AI');
    });

    it('hides AI items without a selection', () => {
        editorService.getSelectedText = () => '';
        const labels = manager._buildEditorMenu().map((el) => el.textContent);
        expect(labels).not.toContain('Edit with AI…');
        expect(labels).not.toContain('Improve with AI');
    });
});
