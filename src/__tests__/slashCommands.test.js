/**
 * Tests for features/slash-commands/index.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Monaco editor API for tests
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
    default: {
        editor: {
            Range: class Range {
                constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
                    this.startLineNumber = startLineNumber;
                    this.startColumn = startColumn;
                    this.endLineNumber = endLineNumber;
                    this.endColumn = endColumn;
                }
            }
        }
    }
}));

import { SlashCommandsManager } from '../features/slash-commands/index.js';
import { SLASH_COMMANDS } from '../features/slash-commands/registry.js';

describe('features/slash-commands — registry', () => {
    it('has at least 12 commands', () => {
        expect(SLASH_COMMANDS.length).toBeGreaterThanOrEqual(12);
    });

    it('each command has required fields', () => {
        for (const cmd of SLASH_COMMANDS) {
            expect(cmd).toHaveProperty('id');
            expect(cmd).toHaveProperty('label');
            expect(cmd).toHaveProperty('desc');
            expect(cmd).toHaveProperty('icon');
            expect(cmd).toHaveProperty('insert');
            expect(cmd).toHaveProperty('keywords');
            expect(typeof cmd.id).toBe('string');
            expect(typeof cmd.label).toBe('string');
            expect(typeof cmd.insert).toBe('string');
            expect(Array.isArray(cmd.keywords)).toBe(true);
        }
    });
});

describe('features/slash-commands — manager plumbing', () => {
    let manager;

    beforeEach(() => {
        manager = new SlashCommandsManager();
    });

    afterEach(() => {
        if (manager) manager.dispose();
    });

    it('is a singleton', () => {
        const again = new SlashCommandsManager();
        expect(again).toBe(manager);
    });

    it('initialize() creates menu element and binds editor', () => {
        const mockEditor = {
            getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
            getPosition: () => ({ lineNumber: 1, column: 1 }),
            getModel: () => ({
                getLineContent: (line) => '/',
            }),
            getScrolledVisiblePosition: () => ({ top: 0, left: 0 }),
            getDomNode: () => ({ getBoundingClientRect: () => ({ top: 0, left: 0 }) }),
            onDidChangeModelContent: () => ({ dispose: () => {} }),
            focus: () => {},
            executeEdits: () => {},
        };

        manager.initialize(mockEditor);
        expect(manager.editor).toBe(mockEditor);
        expect(manager.menu).not.toBeNull();
        expect(manager.menu.id).toBe('slash-menu');
        expect(manager.menu.style.display).toBe('none');
    });

    it('show() makes menu visible (sets display)', () => {
        const mockEditor = {
            getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
            getPosition: () => ({ lineNumber: 1, column: 1 }),
            getModel: () => ({
                getLineContent: (line) => '/',
            }),
            getScrolledVisiblePosition: () => ({ top: 0, left: 0 }),
            getDomNode: () => ({ getBoundingClientRect: () => ({ top: 0, left: 0 }) }),
            onDidChangeModelContent: () => ({ dispose: () => {} }),
            focus: () => {},
            executeEdits: () => {},
        };

        manager.initialize(mockEditor);
        manager.show({ startLineNumber: 1, startColumn: 1 });
        expect(manager.menu.style.display).toBe('block');
        expect(manager.visible).toBe(true);
    });

    it('hide() sets display none', () => {
        const mockEditor = {
            getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
            getPosition: () => ({ lineNumber: 1, column: 1 }),
            getModel: () => ({
                getLineContent: (line) => '/',
            }),
            getScrolledVisiblePosition: () => ({ top: 0, left: 0 }),
            getDomNode: () => ({ getBoundingClientRect: () => ({ top: 0, left: 0 }) }),
            onDidChangeModelContent: () => ({ dispose: () => {} }),
            focus: () => {},
            executeEdits: () => {},
        };

        manager.initialize(mockEditor);
        manager.show({ startLineNumber: 1, startColumn: 1 });
        manager.hide();
        expect(manager.menu.style.display).toBe('none');
        expect(manager.visible).toBe(false);
    });

    it('dispose removes DOM and listeners', () => {
        const mockEditor = {
            getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
            getPosition: () => ({ lineNumber: 1, column: 1 }),
            getModel: () => ({
                getLineContent: (line) => '/',
            }),
            getScrolledVisiblePosition: () => ({ top: 0, left: 0 }),
            getDomNode: () => ({ getBoundingClientRect: () => ({ top: 0, left: 0 }) }),
            onDidChangeModelContent: () => ({ dispose: () => {} }),
            focus: () => {},
            executeEdits: () => {},
        };

        manager.initialize(mockEditor);
        manager.show({ startLineNumber: 1, startColumn: 1 });
        manager.dispose();
        expect(manager.menu).toBeNull();
        expect(manager.editor).toBeNull();
        expect(SlashCommandsManager.instance).toBeNull();
    });

    it('select command inserts text at cursor position', () => {
        const insertedTexts = [];
        const mockEditor = {
            getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
            getPosition: () => ({ lineNumber: 1, column: 1 }),
            getModel: () => ({
                getLineContent: (line) => '/',
            }),
            getScrolledVisiblePosition: () => ({ top: 0, left: 0 }),
            getDomNode: () => ({ getBoundingClientRect: () => ({ top: 0, left: 0 }) }),
            onDidChangeModelContent: () => ({ dispose: () => {} }),
            focus: () => {},
            executeEdits: (source, edits) => {
                insertedTexts.push({ source, edits });
            },
        };

        manager.initialize(mockEditor);
        manager.show({ startLineNumber: 1, startColumn: 1 });

        // Directly call _selectCommand to test insertion
        const cmd = SLASH_COMMANDS[0];
        manager._selectCommand(cmd);

        // Should have inserted the command text
        expect(insertedTexts.length).toBeGreaterThanOrEqual(1);
    });
});
