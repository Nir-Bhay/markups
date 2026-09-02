// Tests for utils/eventBus.js and utils/debounce.js — low-level primitives.
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { eventBus, EVENTS, Subscriptions } from '../utils/eventBus.js';
import { debounce } from '../utils/debounce.js';

describe('utils/eventBus', () => {
    beforeEach(() => {
        eventBus.clear();
    });

    it('registers and emits a single listener', () => {
        const fn = vi.fn();
        eventBus.on(EVENTS.CONTENT_CHANGED, fn);
        eventBus.emit(EVENTS.CONTENT_CHANGED, { content: 'x' });
        expect(fn).toHaveBeenCalledOnce();
        expect(fn.mock.calls[0][0]).toEqual({ content: 'x' });
    });

    it('off removes the listener', () => {
        const fn = vi.fn();
        const unsub = eventBus.on(EVENTS.CONTENT_CHANGED, fn);
        unsub();
        eventBus.emit(EVENTS.CONTENT_CHANGED);
        expect(fn).not.toHaveBeenCalled();
    });

    it('once auto-removes after first emit', () => {
        const fn = vi.fn();
        eventBus.once(EVENTS.CONTENT_CHANGED, fn);
        eventBus.emit(EVENTS.CONTENT_CHANGED);
        eventBus.emit(EVENTS.CONTENT_CHANGED);
        expect(fn).toHaveBeenCalledOnce();
    });

    it('Subscriptions.on tracks handlers and dispose detaches them', () => {
        const a = vi.fn();
        const b = vi.fn();
        const subs = new Subscriptions();
        subs.on(EVENTS.CONTENT_CHANGED, a);
        subs.on(EVENTS.STATS_UPDATED, b);
        subs.dispose();
        eventBus.emit(EVENTS.CONTENT_CHANGED);
        eventBus.emit(EVENTS.STATS_UPDATED);
        expect(a).not.toHaveBeenCalled();
        expect(b).not.toHaveBeenCalled();
        expect(subs.size).toBe(0);
    });

    it('Subscriptions.track stores an existing unsubscribe handle', () => {
        const fn = vi.fn();
        const unsub = eventBus.on(EVENTS.CONTENT_CHANGED, fn);
        const subs = new Subscriptions();
        subs.track(unsub);
        subs.dispose();
        eventBus.emit(EVENTS.CONTENT_CHANGED);
        expect(fn).not.toHaveBeenCalled();
    });
});

describe('utils/debounce', () => {
    it('delays execution until pause in calls', async () => {
        const fn = vi.fn();
        const d = debounce(fn, 50);
        d();
        d();
        d();
        expect(fn).not.toHaveBeenCalled();
        await new Promise(r => setTimeout(r, 120));
        expect(fn).toHaveBeenCalledOnce();
    });

    it('cancel prevents trailing execution', async () => {
        const fn = vi.fn();
        const d = debounce(fn, 100);
        d();
        d.cancel();
        await new Promise(r => setTimeout(r, 150));
        expect(fn).not.toHaveBeenCalled();
    });
});
