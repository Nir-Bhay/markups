// Tests for features/image-resize/utils.js — clamp, size formatting, regex
// escaping, and the debounce/throttle wrappers used by resize interactions.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clamp, uid, debounce, throttle, formatBytes, escapeRegex } from '../features/image-resize/utils.js';

describe('features/image-resize/utils — clamp', () => {
    it('passes values inside the range through unchanged', () => {
        expect(clamp(50, 30, 4000)).toBe(50);
    });

    it('clamps below-min and above-max values', () => {
        expect(clamp(10, 30, 4000)).toBe(30);
        expect(clamp(5000, 30, 4000)).toBe(4000);
        expect(clamp(-5, 30, 4000)).toBe(30);
        expect(clamp(0, 1, 10)).toBe(1);
    });
});

describe('features/image-resize/utils — uid', () => {
    it('returns unique ids with the expected shape', () => {
        const seen = new Set();
        for (let i = 0; i < 100; i++) {
            const id = uid();
            expect(id).toMatch(/^ir_[a-z0-9]{7}$/);
            seen.add(id);
        }
        expect(seen.size).toBe(100);
    });
});

describe('features/image-resize/utils — formatBytes', () => {
    it('formats sizes below each unit threshold', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(1024)).toBe('1.0 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(formatBytes(1048576)).toBe('1.0 MB');
        expect(formatBytes(2097152)).toBe('2.0 MB');
    });
});

describe('features/image-resize/utils — escapeRegex', () => {
    it('escapes regex metacharacters', () => {
        expect(escapeRegex('a.b*')).toBe('a\\.b\\*');
        expect(escapeRegex('(x)[y]{1}?')).toBe('\\(x\\)\\[y\\]\\{1\\}\\?');
    });

    it('returns empty string for empty, falsy, or oversized input', () => {
        expect(escapeRegex('')).toBe('');
        expect(escapeRegex(null)).toBe('');
        expect(escapeRegex('a'.repeat(1001))).toBe('');
    });

    it('escaped output is safe to embed in a RegExp', () => {
        const re = new RegExp(escapeRegex('file(1).png'));
        expect(re.test('file(1).png')).toBe(true);
        expect(re.test('file1.png')).toBe(false);
    });
});

describe('features/image-resize/utils — debounce & throttle', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('debounce fires once after the delay with the last arguments', () => {
        const fn = vi.fn();
        const d = debounce(fn, 100);
        d(1);
        d(2);
        d(3);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(99);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(3);
    });

    it('throttle fires at most once per interval', () => {
        const fn = vi.fn();
        const t = throttle(fn, 100);
        t(1);
        t(2);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(1);
        vi.advanceTimersByTime(100);
        t(3);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenCalledWith(3);
    });
});
