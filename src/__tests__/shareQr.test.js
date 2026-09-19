import { describe, it, expect } from 'vitest';
import { buildQrSvg, qrFits, QR_MAX_CHARS, renderQrInto } from '../services/share/qr.js';

describe('services/share/qr', () => {
    it('builds a scalable SVG for a short link', () => {
        const svg = buildQrSvg('https://markups.dev/#s=abc123');
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox');
    });

    it('refuses links too long to scan reliably', () => {
        const long = `https://x.dev/#${'a'.repeat(QR_MAX_CHARS + 1)}`;
        expect(qrFits(long)).toBe(false);
        expect(() => buildQrSvg(long)).toThrow(/scannable/);
        expect(qrFits('')).toBe(false);
        expect(qrFits('https://markups.dev/#s=short')).toBe(true);
    });

    it('renders into a container and clears on empty input', () => {
        const el = document.createElement('div');
        expect(renderQrInto(el, 'https://markups.dev/#s=abc')).toBe(true);
        expect(el.innerHTML).toContain('<svg');
        expect(renderQrInto(el, '')).toBe(false);
        expect(renderQrInto(null, 'https://markups.dev/#s=abc')).toBe(false);
    });
});
