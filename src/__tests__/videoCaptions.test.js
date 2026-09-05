import { describe, it, expect } from 'vitest';
import { extractCaptionsUrl } from '../utils/video-embed.js';

describe('video captions URL extraction (a11y L1)', () => {
    it('extracts https URL with .vtt extension', () => {
        const url = 'https://example.com/captions/demo.vtt';
        expect(extractCaptionsUrl(`caption=${url}`)).toBe(url);
    });

    it('accepts `captions=` (with s) variant', () => {
        const url = 'https://example.com/demo.webvtt';
        expect(extractCaptionsUrl(`captions=${url}`)).toBe(url);
    });

    it('accepts `caption=` inside a {video ...} attribute block', () => {
        const url = 'https://cdn.example.com/clip.vtt';
        expect(extractCaptionsUrl(`width=50% caption=${url} align=center`)).toBe(url);
    });

    it('strips a leading "video " keyword (parseVideoAttributeText strips it)', () => {
        const url = 'https://x.com/c.vtt';
        expect(extractCaptionsUrl(`video caption=${url}`)).toBe(url);
    });

    it('returns empty string when no captions URL present', () => {
        expect(extractCaptionsUrl('width=50% mode=embed')).toBe('');
    });

    it('rejects non-vtt URLs (security — never embed arbitrary captions files)', () => {
        expect(extractCaptionsUrl('caption=https://example.com/captions.html')).toBe('');
        expect(extractCaptionsUrl('caption=https://example.com/captions.srt')).toBe('');
    });

    it('accepts protocol-relative //example.com/foo.vtt URLs', () => {
        const url = '//cdn.example.com/sub.vtt';
        expect(extractCaptionsUrl(`caption=${url}`)).toBe(url);
    });
});
