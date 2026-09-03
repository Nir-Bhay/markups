// Tests for features/image-resize/history.js — undo/redo stack integrity.
// Data-loss risk: a wrong index here silently corrupts the resize undo chain.
import { describe, it, expect } from 'vitest';
import { HistoryStack } from '../features/image-resize/history.js';

describe('features/image-resize/history — HistoryStack', () => {
    it('pushes states and undoes/redoes in order', () => {
        const h = new HistoryStack(10);
        h.push({ w: 100 });
        h.push({ w: 200 });
        h.push({ w: 300 });

        expect(h.canUndo).toBe(true);
        expect(h.undo()).toEqual({ w: 200 });
        expect(h.undo()).toEqual({ w: 100 });
        expect(h.canUndo).toBe(false);
        expect(h.undo()).toBeNull();

        expect(h.redo()).toEqual({ w: 200 });
        expect(h.redo()).toEqual({ w: 300 });
        expect(h.canRedo).toBe(false);
        expect(h.redo()).toBeNull();
    });

    it('truncates redo history when a new state is pushed after undo', () => {
        const h = new HistoryStack(10);
        h.push({ w: 100 });
        h.push({ w: 200 });
        h.undo(); // back to 100
        h.push({ w: 150 });

        expect(h.redo()).toBeNull();
        expect(h.undo()).toEqual({ w: 100 });
        expect(h.undo()).toBeNull();
        expect(h.redo()).toEqual({ w: 150 });
    });

    it('enforces the history limit, dropping the oldest state', () => {
        const h = new HistoryStack(3);
        h.push({ v: 1 });
        h.push({ v: 2 });
        h.push({ v: 3 });
        h.push({ v: 4 }); // evicts v:1

        expect(h.canUndo).toBe(true);
        expect(h.undo()).toEqual({ v: 3 });
        expect(h.undo()).toEqual({ v: 2 });
        expect(h.undo()).toBeNull();
        expect(h.redo()).toEqual({ v: 3 });
        expect(h.redo()).toEqual({ v: 4 });
        expect(h.redo()).toBeNull();
    });

    it('undo winds back to the previous state, not the state being undone', () => {
        const h = new HistoryStack(2);
        h.push({ v: 1 });
        h.push({ v: 2 });
        h.undo(); // now positioned at v:1
        h.push({ v: 9 }); // truncates v:2

        expect(h.undo()).toEqual({ v: 1 });
        expect(h.undo()).toBeNull();
        expect(h.redo()).toEqual({ v: 9 });
    });

    it('returns deep copies so callers cannot mutate the stack', () => {
        const h = new HistoryStack(10);
        h.push({ w: 100, meta: { layer: 'a' } });
        h.push({ w: 200, meta: { layer: 'b' } });
        const got = h.undo(); // copy of the first state
        got.w = 999;
        got.meta.layer = 'mutated';
        expect(h.redo().meta.layer).toBe('b');
        expect(h.undo().w).toBe(100);

        const h2 = new HistoryStack(10);
        const state = { w: 50 };
        h2.push(state);
        h2.push({ w: 60 });
        state.w = 999;
        expect(h2.undo().w).toBe(50);
    });

    it('clear() resets navigation state', () => {
        const h = new HistoryStack(10);
        h.push({ v: 1 });
        h.clear();
        expect(h.canUndo).toBe(false);
        expect(h.canRedo).toBe(false);
        expect(h.undo()).toBeNull();
        expect(h.redo()).toBeNull();
    });

    it('uses the configured default limit of 40', () => {
        const h = new HistoryStack();
        for (let i = 0; i < 45; i++) h.push({ v: i });
        expect(h.undo().v).toBe(43); // v0..v4 evicted, 40 retained, top is v44
        expect(h.redo().v).toBe(44);
        expect(h.redo()).toBeNull();
    });
});
