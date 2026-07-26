/**
 * Quick unit checks for Prism language resolution (Issue #42)
 * Run: node --input-type=module -e "import('./test-prism-resolve.mjs')"
 * Or:  node test-prism-resolve.mjs
 */
import Prism from 'prismjs';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-sql.js';

const LANGUAGE_ALIASES = {
    htm: 'markup',
    xhtml: 'markup',
    xml: 'xml',
    svg: 'svg',
    mathml: 'mathml',
    ssml: 'xml',
    atom: 'xml',
    rss: 'xml',
    plaintext: 'plaintext',
    text: 'plaintext',
    txt: 'plaintext',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    console: 'bash',
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    yml: 'yaml',
    md: 'markdown',
    csharp: 'csharp',
    'c#': 'csharp',
    cpp: 'cpp',
    'c++': 'cpp'
};

function resolvePrismLanguage(lang) {
    if (!lang) return 'plaintext';
    const normalized = String(lang).trim().toLowerCase();
    const aliased = LANGUAGE_ALIASES[normalized] || normalized;
    if (Prism.languages[aliased]) return aliased;
    if (Prism.languages[normalized]) return normalized;
    return 'plaintext';
}

const cases = [
    ['xml', 'xml'],
    ['XML', 'xml'],
    ['Xml', 'xml'],
    [' svg ', 'svg'],
    ['html', 'html'],
    ['HTML', 'html'],
    ['js', 'javascript'],
    ['JS', 'javascript'],
    ['unknown-lang', 'plaintext'],
    ['', 'plaintext'],
    [null, 'plaintext']
];

let failed = 0;
for (const [input, expected] of cases) {
    const got = resolvePrismLanguage(input);
    const ok = got === expected;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}: resolve(${JSON.stringify(input)}) => ${got} (expected ${expected})`);
}

// Smoke: actual highlight for XML sample
const sample = '<Sid Name="test" Flag="1" />';
const highlighted = Prism.highlight(sample, Prism.languages.xml, 'xml');
const hasTag = highlighted.includes('tag') || highlighted.includes('class=');
console.log(`${hasTag ? 'PASS' : 'FAIL'}: Prism XML highlight produces token classes`);
if (!hasTag) failed++;

console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
