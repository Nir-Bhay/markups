import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const md = fs.readFileSync(path.join(root, 'markups-deep-real-world-markdown-corpus.md'), 'utf8');

const start = md.indexOf('# 24. Math: Blocks');
const end = md.indexOf('# 25.', start);
if (start < 0 || end < 0) {
    console.error('section 24 missing');
    process.exit(1);
}
const block = md.slice(start, end);

// Double-escaped TeX inside $$ (bad fixture pattern): $$ ... \\int ...
if (/\$\$[\s\S]*?\\\\(int|sum|lim|frac|begin)/.test(block)) {
    console.error('FAIL: section 24 still has double-backslash TeX');
    process.exit(1);
}
if (!/\\int_0\^1/.test(block) || !/\\begin\{bmatrix\}/.test(block)) {
    console.error('FAIL: expected single-backslash KaTeX commands in section 24');
    process.exit(1);
}

console.log('math fixture single-backslash ok');
