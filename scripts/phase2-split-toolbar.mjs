/**
 * Phase 2: Split src/features/toolbar/index.js into modules.
 * Run: node scripts/phase2-split-toolbar.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../src/features/toolbar');
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

// ── constants.js ──
let constBody = slice(20, 119)
  .replace(/^const COLORS/, 'export const COLORS')
  .replace(/^const HIGHLIGHT_COLORS/, 'export const HIGHLIGHT_COLORS')
  .replace(/^const EMOJI_SETS/, 'export const EMOJI_SETS')
  .replace(/^const CODE_LANGUAGES/, 'export const CODE_LANGUAGES')
  .replace(/^const SPECIAL_CHARS/, 'export const SPECIAL_CHARS')
  .replace(/^const TABLE_MAX/, 'export const TABLE_MAX');
// CALLOUT_TYPES already has export

fs.writeFileSync(
  path.join(root, 'constants.js'),
  `/**
 * Toolbar constants and configuration data
 * @module features/toolbar/constants
 */

export const TOOLBAR_STORAGE_KEY = 'markups_toolbar_prefs';

${constBody}
`
);
console.log('Wrote constants.js');

// ── utils.js ──
let utilsBody = slice(125, 390)
  .replace(/^function uid/, 'export function uid')
  .replace(/^function escHtml/, 'export function escHtml')
  .replace(/^function resolveEditor/, 'export function resolveEditor')
  .replace(/^function getDateFormatted/, 'export function getDateFormatted')
  .replace(/^function generateLorem/, 'export function generateLorem')
  .replace(/^function wrapSelection\(/m, 'export function wrapSelection(')
  .replace(/^function wrapSelectionHtml/, 'export function wrapSelectionHtml')
  .replace(/^function prefixLine/, 'export function prefixLine')
  .replace(/^function insertText/, 'export function insertText')
  .replace(/^function replaceSelection/, 'export function replaceSelection')
  .replace(/^function getSelection/, 'export function getSelection')
  .replace(/^function transformSelection/, 'export function transformSelection')
  .replace(/^function insertLink/, 'export function insertLink')
  .replace(/^function insertImage/, 'export function insertImage')
  .replace(/^function insertTable/, 'export function insertTable');

fs.writeFileSync(
  path.join(root, 'utils.js'),
  `/**
 * Toolbar editor helpers and utilities
 * @module features/toolbar/utils
 */

import { editorService } from '../../core/editor/index.js';

${utilsBody}
`
);
console.log('Wrote utils.js');

// ── preferences.js ──
let prefsBody = slice(393, 461)
  .replace(/^class ToolbarPreferences/, 'export class ToolbarPreferences')
  .replace(/^const prefs = new ToolbarPreferences/, 'export const prefs = new ToolbarPreferences');

fs.writeFileSync(
  path.join(root, 'preferences.js'),
  `/**
 * Toolbar user preferences (localStorage)
 * @module features/toolbar/preferences
 */

import { TOOLBAR_STORAGE_KEY } from './constants.js';

${prefsBody}
`
);
console.log('Wrote preferences.js');

// ── popovers.js (PopoverManager only; open-* methods stay on ToolbarManager) ──
let popBody = slice(467, 530)
  .replace(/^class PopoverManager/, 'export class PopoverManager')
  .replace(/^const popover = new PopoverManager/, 'export const popover = new PopoverManager');

fs.writeFileSync(
  path.join(root, 'popovers.js'),
  `/**
 * Toolbar popover / dropdown positioning manager
 * @module features/toolbar/popovers
 */

${popBody}
`
);
console.log('Wrote popovers.js');

// ── dropdowns.js (TOOLBAR_GROUPS) ──
let ddBody = slice(536, 957).replace(
  /^const TOOLBAR_GROUPS/,
  'export const TOOLBAR_GROUPS'
);

fs.writeFileSync(
  path.join(root, 'dropdowns.js'),
  `/**
 * Toolbar button group definitions (dropdowns / actions)
 * @module features/toolbar/dropdowns
 */

import { CALLOUT_TYPES, CODE_LANGUAGES } from './constants.js';
import { prefs } from './preferences.js';
import {
  resolveEditor,
  wrapSelection,
  wrapSelectionHtml,
  prefixLine,
  insertText,
  getSelection,
  transformSelection,
  insertLink,
  insertImage,
  insertTable,
  getDateFormatted,
  generateLorem,
  escHtml,
} from './utils.js';

${ddBody}
`
);
console.log('Wrote dropdowns.js');

// ── styles.js ──
let stylesBody = slice(963, 1445).replace(
  /^function injectToolbarStyles/,
  'export function injectToolbarStyles'
);

fs.writeFileSync(
  path.join(root, 'styles.js'),
  `/**
 * Toolbar injected CSS
 * @module features/toolbar/styles
 */

import { TABLE_MAX } from './constants.js';

${stylesBody}
`
);
console.log('Wrote styles.js');

// ── manager.js (ToolbarManager class) ──
let mgrBody = slice(1448, 2543).replace(
  /^class ToolbarManager/,
  'export class ToolbarManager'
);

fs.writeFileSync(
  path.join(root, 'manager.js'),
  `/**
 * ToolbarManager — orchestration, rendering, popover UIs
 * @module features/toolbar/manager
 */

import {
  COLORS,
  HIGHLIGHT_COLORS,
  EMOJI_SETS,
  SPECIAL_CHARS,
  TABLE_MAX,
} from './constants.js';
import { TOOLBAR_GROUPS } from './dropdowns.js';
import { prefs } from './preferences.js';
import { popover } from './popovers.js';
import { injectToolbarStyles } from './styles.js';
import {
  resolveEditor,
  wrapSelectionHtml,
  insertText,
  getSelection,
  insertTable,
} from './utils.js';

${mgrBody}
`
);
console.log('Wrote manager.js');

// ── index.js (orchestrator / public API) ──
const indexJs = `/**
 * Enhanced Toolbar Feature Module v2.0
 * Orchestrator — public API preserved for main.js / mobile / app.js
 * @module features/toolbar
 */

export { CALLOUT_TYPES } from './constants.js';
export {
  wrapSelection,
  wrapSelectionHtml,
  prefixLine,
  insertText,
  replaceSelection,
  getSelection,
  transformSelection,
  insertLink,
  insertImage,
  insertTable,
  getDateFormatted,
  generateLorem,
  resolveEditor,
} from './utils.js';
export { ToolbarManager } from './manager.js';
export { prefs as toolbarPrefs } from './preferences.js';
export { popover as toolbarPopover } from './popovers.js';
export { TOOLBAR_GROUPS } from './dropdowns.js';

import { ToolbarManager } from './manager.js';

/** Singleton toolbar manager */
export const toolbarManager = new ToolbarManager();

export default toolbarManager;
`;

fs.writeFileSync(srcPath, indexJs);
console.log('Wrote index.js orchestrator');

// Verify line counts
for (const f of [
  'constants.js',
  'utils.js',
  'preferences.js',
  'popovers.js',
  'dropdowns.js',
  'styles.js',
  'manager.js',
  'index.js',
]) {
  const n = fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/).length;
  console.log(`  ${f}: ${n} lines`);
}

console.log('Done.');
