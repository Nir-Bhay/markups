import { describe, expect, it, vi } from 'vitest';
import { trackEditorStartOnce, trackExportCompleted } from '../utils/productAnalytics.js';

function liveContext() {
    const storage = new Map();
    const gtag = vi.fn();
    const context = {
        location: { hostname: 'markups.dev' },
        gtag,
        sessionStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { storage.set(key, value); }
        }
    };
    return { context, gtag, storage };
}

describe('privacy-safe product analytics', () => {
    it('tracks export format but never sends document/filename/secret fields', () => {
        const { context, gtag } = liveContext();
        expect(trackExportCompleted('pdf', context)).toBe(true);
        expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'export_completed', { export_format: 'pdf' });
        expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/document|filename|api.?key|markdown_content/i);
        expect(trackExportCompleted('../evil?doc=secret', context)).toBe(false);
        expect(gtag).toHaveBeenCalledTimes(1);
    });

    it('does not emit on localhost or when gtag is unavailable', () => {
        const { context, gtag } = liveContext();
        context.location.hostname = 'localhost';
        expect(trackExportCompleted('html', context)).toBe(false);
        context.location.hostname = 'markups.dev';
        delete context.gtag;
        expect(trackExportCompleted('html', context)).toBe(false);
        expect(gtag).not.toHaveBeenCalled();
    });

    it('does not let measurement errors break export', () => {
        const { context } = liveContext();
        context.gtag = () => { throw new Error('blocked analytics'); };
        expect(trackExportCompleted('md', context)).toBe(false);
    });

    it('sends one editor_start per browser session, not one per keystroke', () => {
        const { context, gtag, storage } = liveContext();
        expect(trackEditorStartOnce(context)).toBe(true);
        expect(trackEditorStartOnce(context)).toBe(false);
        expect(gtag).toHaveBeenCalledTimes(1);
        expect(gtag).toHaveBeenCalledWith('event', 'editor_start', {});
        expect(storage.get('markups_editor_started_v1')).toBe('1');
    });
});
