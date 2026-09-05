// Tests for utils/file.js — file type routing, size formatting, and the
// image-security helpers (magic-byte validation + SVG sanitization).
import { describe, it, expect } from 'vitest';
import {
    getExtension,
    getBaseName,
    isImageFile,
    isMarkdownFile,
    isTextFile,
    formatFileSize,
    validateFileSize,
    validateImageSignature,
    sanitizeSvgToDataUrl
} from '../utils/file.js';

describe('utils/file — extension & name helpers', () => {
    it('extracts lowercase extension from filename', () => {
        expect(getExtension('notes.md')).toBe('md');
        expect(getExtension('PHOTO.PNG')).toBe('png');
        expect(getExtension('archive.tar.gz')).toBe('gz');
    });

    it('handles dotfiles and filenames without an extension', () => {
        expect(getExtension('.gitignore')).toBe('gitignore');
        expect(getExtension('readme.')).toBe('');
        expect(getExtension('noext')).toBe('');
    });

    it('extracts base name without extension', () => {
        expect(getBaseName('notes.md')).toBe('notes');
        expect(getBaseName('a.b.md')).toBe('a.b');
        expect(getBaseName('noext')).toBe('noext');
        expect(getBaseName('.hidden')).toBe('.hidden');
        expect(getBaseName('file.')).toBe('file');
    });
});

describe('utils/file — file type detection', () => {
    const file = (name, type) => ({ name, type });

    it('detects image files by MIME type', () => {
        expect(isImageFile(file('a.png', 'image/png'))).toBe(true);
        expect(isImageFile(file('a.pdf', 'application/pdf'))).toBe(false);
        expect(isImageFile(file('a.bin', ''))).toBe(false);
    });

    it('detects markdown files by extension', () => {
        expect(isMarkdownFile(file('README.md', 'text/markdown'))).toBe(true);
        expect(isMarkdownFile(file('notes.markdown', 'application/octet-stream'))).toBe(true);
        expect(isMarkdownFile(file('draft.MKD', ''))).toBe(true);
        expect(isMarkdownFile(file('notes.txt', 'text/plain'))).toBe(false);
    });

    it('detects text files by MIME type or markdown extension', () => {
        expect(isTextFile(file('a.txt', 'text/plain'))).toBe(true);
        expect(isTextFile(file('a.md', 'application/octet-stream'))).toBe(true);
        expect(isTextFile(file('a.png', 'image/png'))).toBe(false);
    });
});

describe('utils/file — size helpers', () => {
    it('formats zero and byte sizes', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
        expect(formatFileSize(512)).toBe('512 Bytes');
    });

    it('formats KB/MB with the requested decimals', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
        expect(formatFileSize(1048576)).toBe('1 MB');
        expect(formatFileSize(1572864, 1)).toBe('1.5 MB');
    });

    it('validates file size against an MB limit (inclusive)', () => {
        expect(validateFileSize({ size: 5 * 1024 * 1024 }, 5)).toBe(true);
        expect(validateFileSize({ size: 5 * 1024 * 1024 + 1 }, 5)).toBe(false);
    });
});

describe('utils/file — image signature validation', () => {
    const fromHex = (hex) => new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16)));

    it('accepts JPEG/PNG/GIF/WebP magic bytes when they match the declared type', () => {
        expect(validateImageSignature(fromHex('ffd8ffe000104a464946'), 'image/jpeg')).toBe(true);
        expect(validateImageSignature(fromHex('89504e470d0a1a0a0000000d'), 'image/png')).toBe(true);
        expect(validateImageSignature(fromHex('4749463839610000'), 'image/gif')).toBe(true);
        expect(validateImageSignature(fromHex('52494646100000005745425000'), 'image/webp')).toBe(true);
    });

    it('rejects buffers whose signature does not match the declared type', () => {
        const png = fromHex('89504e470d0a1a0a');
        expect(validateImageSignature(png, 'image/jpeg')).toBe(false);
        expect(validateImageSignature(png, 'image/gif')).toBe(false);
    });

    it('accepts ArrayBuffer input as well as typed-array views', () => {
        const bytes = fromHex('ffd8ffe00010');
        expect(validateImageSignature(bytes.buffer, 'image/jpeg')).toBe(true);
    });

    it('rejects truncated, too-short, and missing buffers', () => {
        expect(validateImageSignature(fromHex('ffd8'), 'image/jpeg')).toBe(false);
        expect(validateImageSignature(fromHex('5249464610000000'), 'image/webp')).toBe(false);
        expect(validateImageSignature(null, 'image/png')).toBe(false);
        expect(validateImageSignature(fromHex('ffd8ff'), undefined)).toBe(false);
    });

    it('treats svg+xml as valid by signature (sanitization happens separately)', () => {
        expect(validateImageSignature(fromHex('3c737667'), 'image/svg+xml')).toBe(true);
    });
});

describe('utils/file — SVG sanitization', () => {
    const decodeDataUrl = (url) => {
        const prefix = 'data:image/svg+xml;base64,';
        expect(url.startsWith(prefix)).toBe(true);
        return atob(url.slice(prefix.length));
    };

    it('wraps a clean SVG in a base64 data URL', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1"/></svg>';
        const decoded = decodeDataUrl(sanitizeSvgToDataUrl(svg));
        expect(decoded).toContain('<svg');
        expect(decoded).toContain('<circle');
    });

    it('removes script tags from SVG payloads', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="10" height="10"/></svg>';
        const decoded = decodeDataUrl(sanitizeSvgToDataUrl(svg));
        expect(decoded).not.toContain('script');
    });

    it('strips event handlers and style attributes', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">' +
            '<rect onmouseover="steal()" style="display:none"/></svg>';
        const decoded = decodeDataUrl(sanitizeSvgToDataUrl(svg));
        expect(decoded).not.toMatch(/onload/i);
        expect(decoded).not.toMatch(/onmouseover/i);
        expect(decoded).not.toMatch(/style=/i);
    });

    it('rejects payloads that are not SVG after sanitization', () => {
        expect(sanitizeSvgToDataUrl('<html><body>x</body></html>')).toBeNull();
        expect(sanitizeSvgToDataUrl('plain text')).toBeNull();
        expect(sanitizeSvgToDataUrl('<svg><script>1</script></svg>'.replace('<svg>', ''))).toBeNull();
    });

    it('returns null for empty or non-string input', () => {
        expect(sanitizeSvgToDataUrl('')).toBeNull();
        expect(sanitizeSvgToDataUrl('   \n ')).toBeNull();
        expect(sanitizeSvgToDataUrl(123)).toBeNull();
        expect(sanitizeSvgToDataUrl(null)).toBeNull();
    });
});
