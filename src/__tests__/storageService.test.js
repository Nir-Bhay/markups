/**
 * Tests for StorageService.initialize() (Phase 1.1 — modular boot guard).
 * initialize() must exist, never throw, be idempotent, and report availability.
 */
import { describe, it, expect } from 'vitest';
import { storageService, storage } from '../core/storage/index.js';

describe('core/storage — StorageService.initialize', () => {
    it('exists and never throws', () => {
        expect(typeof storageService.initialize).toBe('function');
        expect(() => storageService.initialize()).not.toThrow();
    });

    it('is idempotent and returns a boolean', () => {
        const first = storageService.initialize();
        const second = storageService.initialize();
        expect(typeof first).toBe('boolean');
        expect(second).toBe(first);
    });

    it('reports available in test env and round-trips a value', () => {
        expect(storageService.initialize()).toBe(true);
        expect(storageService.set('phase11-probe', { a: 1 })).toBe(true);
        expect(storageService.get('phase11-probe')).toEqual({ a: 1 });
        expect(storageService.remove('phase11-probe')).toBe(true);
        expect(storageService.get('phase11-probe')).toBeNull();
    });

    it('storageService is the storage singleton', () => {
        expect(storageService).toBe(storage);
    });
});
