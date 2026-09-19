import { createRequire } from 'module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);

// Vitest/jsdom-style env for DOMPurify
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.DocumentFragment = dom.window.DocumentFragment;

const { sanitizePreviewHtml, PREVIEW_SANITIZE_CONFIG } = await import('../../src/utils/sanitize.js');

if (!PREVIEW_SANITIZE_CONFIG.FORBID_TAGS.includes('iframe')) {
    console.error('FAIL: iframe not forbidden');
    process.exit(1);
}
if (!PREVIEW_SANITIZE_CONFIG.FORBID_TAGS.includes('video')) {
    console.error('FAIL: video not forbidden');
    process.exit(1);
}

const dirty = `
<p>ok</p>
<iframe src="https://evil.example"></iframe>
<video src="https://evil.example/a.mp4" controls></video>
<audio controls><source src="https://evil.example/a.mp3" type="audio/mpeg"></audio>
`;
const clean = sanitizePreviewHtml(dirty);
if (/iframe/i.test(clean) || /<video/i.test(clean)) {
    console.error('FAIL: iframe/video survived sanitize', clean);
    process.exit(1);
}
if (/<audio/i.test(clean) && /source/i.test(clean)) {
    console.error('FAIL: audio/source husk survived', clean);
    process.exit(1);
}

console.log('sanitize forbid iframe video passed');
