import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackedAddEventListener, removeAllTrackedListeners, getTrackedCount } from '../utils/listener-registry.js';

describe('listener-registry', () => {
    let target;

    beforeEach(() => {
        target = {
            handlers: {},
            addEventListener(type, handler, opts) {
                this.handlers[type] = handler;
            },
            removeEventListener(type, handler) {
                delete this.handlers[type];
            }
        };
        // Ensure clean state between tests
        removeAllTrackedListeners();
    });

    afterEach(() => {
        removeAllTrackedListeners();
    });

    it('should register a listener and return the handler', () => {
        const handler = () => {};
        const result = trackedAddEventListener(target, 'click', handler);
        expect(result).toBe(handler);
    });

    it('should track the listener', () => {
        const handler = () => {};
        trackedAddEventListener(target, 'click', handler);
        expect(getTrackedCount()).toBe(1);
    });

    it('should remove all tracked listeners', () => {
        const handler1 = () => {};
        const handler2 = () => {};
        trackedAddEventListener(target, 'click', handler1);
        trackedAddEventListener(target, 'keydown', handler2);
        expect(getTrackedCount()).toBe(2);

        removeAllTrackedListeners();
        expect(getTrackedCount()).toBe(0);
    });

    it('should call removeEventListener on the target for each tracked listener', () => {
        const handler = () => {};
        trackedAddEventListener(target, 'click', handler);
        expect(target.handlers['click']).toBe(handler);

        removeAllTrackedListeners();
        expect(target.handlers['click']).toBeUndefined();
    });

    it('should track multiple listeners on the same target and type', () => {
        const handler1 = () => {};
        const handler2 = () => {};
        trackedAddEventListener(target, 'click', handler1);
        trackedAddEventListener(target, 'click', handler2);
        expect(getTrackedCount()).toBe(2);

        removeAllTrackedListeners();
        expect(getTrackedCount()).toBe(0);
    });

    it('should track listeners on different targets', () => {
        const doc = { handlers: {}, addEventListener() {}, removeEventListener() {} };
        const win = { handlers: {}, addEventListener() {}, removeEventListener() {} };
        trackedAddEventListener(doc, 'click', () => {});
        trackedAddEventListener(win, 'resize', () => {});
        expect(getTrackedCount()).toBe(2);

        removeAllTrackedListeners();
        expect(getTrackedCount()).toBe(0);
    });
});
