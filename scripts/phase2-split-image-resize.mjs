/**
 * Phase 2: Split src/features/image-resize/index.js into modules.
 * Run: node scripts/phase2-split-image-resize.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../src/features/image-resize');
const srcPath = path.join(root, 'index.js');
const src = fs.readFileSync(srcPath, 'utf8');
const lines = src.split(/\r?\n/);

const backupPath = path.join(root, 'index.js.pre-phase2-backup');
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, src);
  console.log('Backup written:', backupPath);
}

/** @param {number} start 1-indexed inclusive @param {number} end 1-indexed inclusive */
function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// ── constants.js (14-74) ──
let constBody = slice(14, 74)
  .replace(/^const CONFIG/, 'export const CONFIG')
  .replace(/^const SIZE_PRESETS/, 'export const SIZE_PRESETS')
  .replace(/^const SHADOW_PRESETS/, 'export const SHADOW_PRESETS')
  .replace(/^const BORDER_RADIUS_PRESETS/, 'export const BORDER_RADIUS_PRESETS')
  .replace(/^const FILTER_PRESETS/, 'export const FILTER_PRESETS')
  .replace(/^const KEYBOARD_SHORTCUTS/, 'export const KEYBOARD_SHORTCUTS')
  .replace(/^const SHIFT_MULTIPLIER/, 'export const SHIFT_MULTIPLIER');

fs.writeFileSync(
  path.join(root, 'constants.js'),
  `/**
 * Image resize configuration and presets
 * @module features/image-resize/constants
 */

${constBody}
`
);
console.log('Wrote constants.js');

// ── utils.js (80-116) ──
let utilsBody = slice(80, 116)
  .replace(/^function clamp/, 'export function clamp')
  .replace(/^function uid/, 'export function uid')
  .replace(/^function debounce/, 'export function debounce')
  .replace(/^function throttle/, 'export function throttle')
  .replace(/^function formatBytes/, 'export function formatBytes')
  .replace(/^function escapeRegex/, 'export function escapeRegex');

fs.writeFileSync(
  path.join(root, 'utils.js'),
  `/**
 * Image resize utility helpers
 * @module features/image-resize/utils
 */

${utilsBody}
`
);
console.log('Wrote utils.js');

// ── history.js (122-159) ──
let histBody = slice(122, 159).replace(
  /^class HistoryStack/,
  'export class HistoryStack'
);

fs.writeFileSync(
  path.join(root, 'history.js'),
  `/**
 * Undo/redo history stack for image resize
 * @module features/image-resize/history
 */

import { CONFIG } from './constants.js';

${histBody}
`
);
console.log('Wrote history.js');

// ── ui.js (ToastManager + SnapGuides + toast singleton) ──
let uiBody = slice(165, 317)
  .replace(/^class ToastManager/, 'export class ToastManager')
  .replace(/^class SnapGuides/, 'export class SnapGuides');

// toast singleton is between ToastManager and SnapGuides (line 241)
uiBody = uiBody.replace(
  /^const toast = new ToastManager/,
  'export const toast = new ToastManager'
);

fs.writeFileSync(
  path.join(root, 'ui.js'),
  `/**
 * Image resize UI helpers (toasts, snap guides)
 * @module features/image-resize/ui
 */

import { CONFIG } from './constants.js';

${uiBody}
`
);
console.log('Wrote ui.js');

// ── core.js (ImageResizeManager) ──
let coreBody = slice(323, 2710).replace(
  /^class ImageResizeManager/,
  'export class ImageResizeManager'
);

fs.writeFileSync(
  path.join(root, 'core.js'),
  `/**
 * ImageResizeManager — core resize / overlay / markdown sync logic
 * @module features/image-resize/core
 */

import {
  CONFIG,
  SIZE_PRESETS,
  SHADOW_PRESETS,
  BORDER_RADIUS_PRESETS,
  FILTER_PRESETS,
  KEYBOARD_SHORTCUTS,
  SHIFT_MULTIPLIER,
} from './constants.js';
import { HistoryStack } from './history.js';
import { toast, SnapGuides } from './ui.js';
import {
  clamp,
  debounce,
  throttle,
  formatBytes,
  escapeRegex,
} from './utils.js';

${coreBody}
`
);
console.log('Wrote core.js');

// ── index.js ──
const indexJs = `/**
 * Enhanced Image Resize Feature v2.0
 * Orchestrator — public API preserved for main.js
 * @module features/image-resize
 */

import { ImageResizeManager } from './core.js';

export { CONFIG, SIZE_PRESETS } from './constants.js';
export { HistoryStack } from './history.js';
export { ToastManager, SnapGuides, toast } from './ui.js';
export { ImageResizeManager } from './core.js';

/** Singleton manager instance */
const imageResizeManager = new ImageResizeManager();

/**
 * Initialize the image resize feature
 * @param {Object} options - Configuration options
 * @param {Object} options.editor - Monaco editor instance
 */
export function initImageResize(options = {}) {
  imageResizeManager.initialize(options);
}

/**
 * Get the image resize manager instance
 * @returns {ImageResizeManager}
 */
export function getImageResizeManager() {
  return imageResizeManager;
}

export default imageResizeManager;
`;

fs.writeFileSync(srcPath, indexJs);
console.log('Wrote index.js orchestrator');

for (const f of [
  'constants.js',
  'utils.js',
  'history.js',
  'ui.js',
  'core.js',
  'index.js',
]) {
  const n = fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/).length;
  console.log(`  ${f}: ${n} lines`);
}

console.log('Done.');
