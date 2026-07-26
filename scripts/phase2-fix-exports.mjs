/**
 * Fix missing/broken exports after Phase 2 split (multiline ^ replacements).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function fixFile(rel, transform) {
  const p = path.join(root, rel);
  const before = fs.readFileSync(p, 'utf8');
  const after = transform(before);
  fs.writeFileSync(p, after);
  console.log('Fixed', rel);
}

// ── toolbar/utils.js: restore "export function" ──
fixFile('src/features/toolbar/utils.js', (s) => {
  // Fix broken "export  name(" -> "export function name("
  s = s.replace(/^export  (\w+)\(/gm, 'export function $1(');
  // Ensure all top-level functions are exported
  s = s.replace(/^function (\w+)\(/gm, 'export function $1(');
  s = s.replace(/^export export function /gm, 'export function ');
  return s;
});

// ── toolbar/constants.js: export all consts ──
fixFile('src/features/toolbar/constants.js', (s) => {
  s = s.replace(/^const /gm, 'export const ');
  s = s.replace(/^export export const /gm, 'export const ');
  return s;
});

// ── toolbar/preferences.js: export prefs singleton ──
fixFile('src/features/toolbar/preferences.js', (s) => {
  s = s.replace(/^const prefs = /m, 'export const prefs = ');
  s = s.replace(/^export export const prefs/m, 'export const prefs');
  return s;
});

// ── toolbar/popovers.js: export popover singleton ──
fixFile('src/features/toolbar/popovers.js', (s) => {
  s = s.replace(/^const popover = /m, 'export const popover = ');
  s = s.replace(/^export export const popover/m, 'export const popover');
  return s;
});

// ── image-resize/constants.js ──
fixFile('src/features/image-resize/constants.js', (s) => {
  s = s.replace(/^const /gm, 'export const ');
  s = s.replace(/^export export const /gm, 'export const ');
  return s;
});

// ── image-resize/utils.js ──
fixFile('src/features/image-resize/utils.js', (s) => {
  s = s.replace(/^function (\w+)\(/gm, 'export function $1(');
  s = s.replace(/^export export function /gm, 'export function ');
  return s;
});

// ── image-resize/ui.js: export toast + SnapGuides ──
fixFile('src/features/image-resize/ui.js', (s) => {
  s = s.replace(/^const toast = /m, 'export const toast = ');
  s = s.replace(/^class SnapGuides/m, 'export class SnapGuides');
  s = s.replace(/^export export /gm, 'export ');
  return s;
});

console.log('All export fixes applied.');
