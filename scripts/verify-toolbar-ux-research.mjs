#!/usr/bin/env node
/**
 * Verifies the toolbar UX research document against live source.
 * Does not change toolbar implementation. Prints a success marker
 * only after every requested assertion passes.
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docPath = path.join(root, 'docs', 'toolbar-ux-research', 'TOOLBAR-UX-RESEARCH.md');
const htmlPath = path.join(root, 'index.html');
const toolbarImplRel = 'src/features/toolbar';
const toolbarIndexRel = path.join(toolbarImplRel, 'index.js');

const REQUIRED_HEADINGS = [
  '## Current inventory',
  '## What works',
  '## What does not work',
  '## Duplicates and overlap',
  '## Platform comparison',
  '## Missing markdown tools',
  '## Recommended information architecture',
  '## Do and do not',
  '## Suggested additions',
  '## Sources',
];

const MIN_UNIQUE_SOURCES = 12;
const gitCommand = 'git';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readUtf8(filePath) {
  if (!existsSync(filePath)) {
    fail(`missing file: ${path.relative(root, filePath)}`);
  }
  return readFileSync(filePath, 'utf8');
}

function parseMode(argv) {
  const flags = argv.filter((arg) => arg.startsWith('--'));
  if (flags.length !== 1) {
    fail('usage: node scripts/verify-toolbar-ux-research.mjs --sections|--inventory|--sources|--no-code-changes');
  }
  return flags[0];
}

function extractToolbarRegion(html) {
  const start = html.indexOf('id="toolbar"');
  const end = html.indexOf('id="enhanced-toolbar"');
  if (start < 0 || end < 0 || end <= start) {
    fail('could not locate production toolbar region in index.html');
  }
  return html.slice(start, end);
}

function extractToolbarControlIds(html) {
  const region = extractToolbarRegion(html);
  const ids = [];
  const re = /\bid="([^"]+)"/g;
  let match;
  while ((match = re.exec(region))) {
    ids.push(match[1]);
  }
  if (ids.length < 20) {
    fail(`toolbar region produced too few ids: ${ids.length}`);
  }
  return [...new Set(ids)];
}

function extractSourcesSection(doc) {
  const heading = '## Sources';
  const start = doc.indexOf(heading);
  if (start < 0) {
    fail('research document is missing ## Sources');
  }
  return doc.slice(start);
}

function uniqueHttpsSources(section) {
  const matches = section.match(/https:\/\/[^\s)>\]]+/g) || [];
  const cleaned = matches.map((url) => url.replace(/[.,;]+$/, ''));
  return [...new Set(cleaned)];
}

function verifySections() {
  const doc = readUtf8(docPath);
  const missing = REQUIRED_HEADINGS.filter((heading) => !doc.includes(heading));
  if (missing.length) {
    fail(`missing required headings: ${missing.join(', ')}`);
  }
  console.log('toolbar ux research sections verified');
}

function verifyInventory() {
  const doc = readUtf8(docPath);
  const html = readUtf8(htmlPath);
  const ids = extractToolbarControlIds(html);
  const missing = ids.filter((id) => !doc.includes(id));
  if (missing.length) {
    fail(`inventory is missing toolbar control ids: ${missing.join(', ')}`);
  }
  console.log('toolbar ux research inventory verified');
}

function verifySources() {
  const doc = readUtf8(docPath);
  const sources = uniqueHttpsSources(extractSourcesSection(doc));
  if (sources.length < MIN_UNIQUE_SOURCES) {
    fail(`Sources section has ${sources.length} unique https URLs; need at least ${MIN_UNIQUE_SOURCES}`);
  }
  console.log('toolbar ux research sources verified');
}

function gitNames(args) {
  const result = spawnSync(gitCommand, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    fail(`git check failed: ${(result.stderr || result.error?.message || 'unknown error').trim()}`);
  }
  return (result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function verifyNoCodeChanges() {
  const implFile = path.join(root, toolbarIndexRel);
  if (!existsSync(implFile)) {
    fail(`positive control missing: ${toolbarIndexRel} is not in the tree`);
  }

  const dirty = [
    ...gitNames(['diff', '--name-only', '--', toolbarImplRel]),
    ...gitNames(['diff', '--cached', '--name-only', '--', toolbarImplRel]),
    ...gitNames(['ls-files', '--others', '--exclude-standard', '--', toolbarImplRel]),
  ];
  const unique = [...new Set(dirty)];
  if (unique.length) {
    fail(`toolbar implementation files changed: ${unique.join(', ')}`);
  }
  console.log('toolbar implementation unmodified');
}

const mode = parseMode(process.argv.slice(2));
if (mode === '--sections') verifySections();
else if (mode === '--inventory') verifyInventory();
else if (mode === '--sources') verifySources();
else if (mode === '--no-code-changes') verifyNoCodeChanges();
else fail(`unknown mode: ${mode}`);
