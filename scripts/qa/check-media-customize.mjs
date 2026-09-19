/**
 * Gate oracle: video + GIF customize isolation and no-blink writeback.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const blinkOnly = process.argv.includes('--blink');

const { applyImageStateToMarkdown, mapDomImagesToMarkdownIndices, updateHtmlAttribute } = await import(
  pathToFileURL(path.join(root, 'src/features/image-resize/markdown-sync.js')).href
);
const { updateVideoAttributesInMarkdownOccurrence } = await import(
  pathToFileURL(path.join(root, 'src/features/video-controls/markdown-sync.js')).href
);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function formatVideoBlock(attrs = {}) {
  const parts = [];
  if (attrs.width) parts.push(`width=${attrs.width}`);
  if (attrs.align) parts.push(`align=${attrs.align}`);
  return parts.length ? `{video ${parts.join(' ')}}` : '';
}

if (blinkOnly) {
  const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
  if (!main.includes('applyMarkdownFromPreviewEdit(markdown)')) {
    fail('video controls must write markdown via applyMarkdownFromPreviewEdit');
  }
  if (!main.includes('initVideoControls')) {
    fail('setupVideoControls must initialize video controls');
  }
  console.log('media customize no-blink writeback passed');
  process.exit(0);
}

const gifLine = '![a](https://cdn.example/1.gif) ![b](https://cdn.example/2.gif) ![c](https://cdn.example/3.gif)';
const gifAttr = '{data-ir=%7B%22width%22%3A200%7D}';
const gifUpdate = applyImageStateToMarkdown(gifLine, { index: 1, attrStr: gifAttr });
if ((gifUpdate.content.match(/data-ir=/g) || []).length !== 1) {
  fail('GIF update must write exactly one data-ir block');
}
if (gifUpdate.content.includes('1.gif) {data-ir=') || gifUpdate.content.includes('3.gif) {data-ir=')) {
  fail('GIF sibling bleed detected');
}

const videoLine = 'https://example.com/a.mp4 https://example.com/b.mp4 https://example.com/c.mp4';
const videoUpdate = updateVideoAttributesInMarkdownOccurrence(
  videoLine,
  'https://example.com/b.mp4',
  { width: '50%', align: 'right' },
  {},
  formatVideoBlock
);
if ((videoUpdate.match(/\{video/g) || []).length !== 1) {
  fail('video update must write exactly one video attribute block');
}
if (videoUpdate.includes('a.mp4 {video') || videoUpdate.includes('c.mp4 {video')) {
  fail('video sibling bleed detected');
}

const dupLine = 'https://example.com/a.mp4 https://example.com/a.mp4 https://example.com/b.mp4';
const dupUpdate = updateVideoAttributesInMarkdownOccurrence(
  dupLine,
  'https://example.com/a.mp4',
  { width: '25%' },
  { occurrenceIndex: 1 },
  formatVideoBlock
);
if (dupUpdate !== 'https://example.com/a.mp4 https://example.com/a.mp4 {video width=25%} https://example.com/b.mp4') {
  fail(`duplicate video occurrence update failed: ${dupUpdate}`);
}

const collidingMap = mapDomImagesToMarkdownIndices(
  ['https://images.unsplash.com/a', 'https://images.unsplash.com/b'],
  [
    { src: 'https://images.unsplash.com/a', isHtmlOnly: true },
    { src: 'https://images.unsplash.com/a' },
    { src: 'https://images.unsplash.com/b' },
  ]
);
if (JSON.stringify(collidingMap) !== '[null,0,1]') {
  fail(`picture/html colliding URL stole markdown index: ${JSON.stringify(collidingMap)}`);
}

const htmlWidth = updateHtmlAttribute('<img width="100" src="https://cdn.example/a.gif">', 'width', 200);
if (htmlWidth !== '<img width="200" src="https://cdn.example/a.gif">') {
  fail(`html width lastIndex bug: ${htmlWidth}`);
}

console.log('media customize isolation passed');
