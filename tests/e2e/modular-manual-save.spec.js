import { test, expect } from '@playwright/test';
import { waitForApp } from './helpers.js';

test('modular manual save does not claim success when note persistence fails', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('modular'), 'Exercises the experimental app.save implementation.');
    await waitForApp(page);
    const failed = await page.evaluate(async () => {
        const { noteStorage } = await import('/src/core/storage/noteStorage.js');
        const original = noteStorage.updateNote;
        const savedEvents = [];
        const { eventBus, EVENTS } = await import('/src/utils/eventBus.js');
        const off = eventBus.on(EVENTS.DOCUMENT_SAVED, event => savedEvents.push(event));
        noteStorage.updateNote = async () => null;
        window.editor.setValue('# Keep this unsaved text');
        try {
            const result = await window.app.save();
            return { result, savedEvents: savedEvents.length, content: window.editor.getValue() };
        } finally {
            off();
            noteStorage.updateNote = original;
        }
    });
    expect(failed.result).toBe(false);
    expect(failed.savedEvents).toBe(0);
    expect(failed.content).toBe('# Keep this unsaved text');
    await expect(page.locator('#save-status')).toHaveAttribute('data-state', 'error');

    const recovered = await page.evaluate(async () => {
        const result = await window.app.save();
        const { noteStorage } = await import('/src/core/storage/noteStorage.js');
        const active = window.__markups_documents.find(tab => tab.id === window.__markups_activeDocId);
        return { result, stored: (await noteStorage.getNote(active.noteId))?.content };
    });
    expect(recovered).toEqual({ result: true, stored: '# Keep this unsaved text' });
    await expect(page.locator('#save-status')).toHaveAttribute('data-state', 'saved');
});
