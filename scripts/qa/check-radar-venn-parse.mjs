import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

// Mermaid 11 expects DOMPurify in Node; provide a minimal jsdom window.
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;

const mermaid = (await import('mermaid')).default;
const md = fs.readFileSync(path.join(root, 'markups-deep-real-world-markdown-corpus.md'), 'utf8');

function extractFence(sectionTitle) {
    const idx = md.indexOf(`# ${sectionTitle}`);
    if (idx < 0) throw new Error(`section missing: ${sectionTitle}`);
    const slice = md.slice(idx, idx + 1200);
    const m = slice.match(/```mermaid\s*\n([\s\S]*?)```/);
    if (!m) throw new Error(`no mermaid fence in ${sectionTitle}`);
    return m[1].trim();
}

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

const radar = extractFence('42. Mermaid: Radar');
const venn = extractFence('43. Mermaid: Venn');

for (const [name, code] of [['radar', radar], ['venn', venn]]) {
    try {
        await Promise.race([
            mermaid.parse(code),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
        ]);
    } catch (e) {
        console.error(`${name} FAIL`, e?.message || e?.str || e);
        process.exit(1);
    }
}

console.log('radar-venn parse passed');
