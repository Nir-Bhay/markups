/**
 * Gate oracle: image data-ir writeback updates exactly one markdown image.
 * Also verifies (--blink) that resize writeback uses the no-convert path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const blinkOnly = process.argv.includes('--blink');

const { applyImageStateToMarkdown } = await import(
  pathToFileURL(path.join(root, 'src/features/image-resize/markdown-sync.js')).href
);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function countAttr(content, attrToken) {
  let n = 0;
  let idx = 0;
  while ((idx = content.indexOf(attrToken, idx)) !== -1) {
    n += 1;
    idx += attrToken.length;
  }
  return n;
}

if (blinkOnly) {
  const mainPath = path.join(root, 'src/main.js');
  const corePath = path.join(root, 'src/features/image-resize/core.js');
  const main = fs.readFileSync(mainPath, 'utf8');
  const core = fs.readFileSync(corePath, 'utf8');

  if (!main.includes('onMarkdownChange: applyMarkdownFromPreviewEdit')) {
    fail('main.js must pass onMarkdownChange: applyMarkdownFromPreviewEdit to image-resize');
  }
  if (!main.includes('isApplyingPreviewEdit = true')) {
    fail('applyMarkdownFromPreviewEdit must set isApplyingPreviewEdit');
  }
  if (!main.includes('if (!isApplyingPreviewEdit)') || !main.includes('debouncedConvert')) {
    fail('onDidChangeModelContent must skip debouncedConvert while isApplyingPreviewEdit');
  }
  if (!core.includes('this.onMarkdownChange(newContent)')) {
    fail('image-resize must prefer onMarkdownChange writeback');
  }
  // Negative control: old blinking setValue-only path must not be the only write
  if (!core.includes('applyImageStateToMarkdown')) {
    fail('image-resize must use applyImageStateToMarkdown');
  }

  console.log('image-ir no-blink writeback passed');
  process.exit(0);
}

const line = [
  '![Simple image](https://images.unsplash.com/photo-1?w=1200)',
  '![Image with long alternate text that should wrap carefully](https://images.unsplash.com/photo-2?w=1600)',
  '[![Linked image](https://images.unsplash.com/photo-3?w=1200)](https://example.com)',
].join(' ');

const attr = '{data-ir=%7B%22width%22%3A440%2C%22height%22%3A214%7D}';

// Positive: update index 0 only
const r0 = applyImageStateToMarkdown(line, { index: 0, attrStr: attr });
if (!r0.found) fail('expected index 0 update to be found');
if (countAttr(r0.content, attr) !== 1) {
  fail(`index 0 should write exactly 1 attr, got ${countAttr(r0.content, attr)}\n${r0.content}`);
}
if (!r0.content.includes(`![Simple image](https://images.unsplash.com/photo-1?w=1200) ${attr}`)) {
  fail('index 0 target missing expected attr suffix');
}
if (r0.content.includes(`photo-2?w=1600) ${attr}`) || r0.content.includes(`photo-3?w=1200) ${attr}`)) {
  fail('sibling images incorrectly received data-ir');
}

// Positive: update middle image only
const r1 = applyImageStateToMarkdown(line, { index: 1, attrStr: attr });
if (countAttr(r1.content, attr) !== 1) {
  fail(`index 1 should write exactly 1 attr, got ${countAttr(r1.content, attr)}`);
}
if (!r1.content.includes(`photo-2?w=1600) ${attr}`)) fail('index 1 target not updated');
if (r1.content.includes(`photo-1?w=1200) ${attr}`) || r1.content.includes(`photo-3?w=1200) ${attr}`)) {
  fail('non-target siblings received data-ir on index 1 update');
}

// Positive: update last (linked) image only
const r2 = applyImageStateToMarkdown(line, { index: 2, attrStr: attr });
if (countAttr(r2.content, attr) !== 1) {
  fail(`index 2 should write exactly 1 attr, got ${countAttr(r2.content, attr)}`);
}

// Positive control for src strategy (unique URL)
const bySrc = applyImageStateToMarkdown(line, {
  src: 'https://images.unsplash.com/photo-2?w=1600',
  attrStr: attr,
});
if (countAttr(bySrc.content, attr) !== 1) {
  fail('unique src strategy must update exactly one image');
}

// HTML-only update must not touch markdown siblings
const htmlDoc = `${line}\n<img src="https://cdn.example/html-only.png" width="100">`;
const htmlAttr = '%7B%22width%22%3A200%7D';
const htmlUpdate = applyImageStateToMarkdown(htmlDoc, {
  src: 'https://cdn.example/html-only.png',
  encodedState: htmlAttr,
  width: 200,
});
if (!htmlUpdate.found || htmlUpdate.strategy !== 'html') {
  fail('expected HTML strategy for html-only image');
}
if (countAttr(htmlUpdate.content, attr) !== 0) {
  fail('HTML update must not add markdown data-ir blocks');
}

console.log('image-ir update isolation passed');
